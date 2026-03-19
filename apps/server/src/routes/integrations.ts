import { db } from "@fresh-mansions/db";
import {
  invoice,
  stripeEvent,
  subscription,
} from "@fresh-mansions/db/schema/domain";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { validateAddressWithRadar } from "../lib/radar";
import { verifyStripeWebhookSignature } from "../lib/stripe";

const app = new Hono();

const validateAddressSchema = z.object({
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2),
  street: z.string().min(1),
  zip: z.string().min(5),
});

interface StripeWebhookEvent {
  created?: number;
  data?: {
    object?: {
      account?: string;
      customer?: string;
      hosted_invoice_url?: string;
      id?: string;
      status?: string;
    };
  };
  id?: string;
  livemode?: boolean;
  type?: string;
}

interface PersistableStripeEvent extends StripeWebhookEvent {
  id: string;
  type: string;
}

const parseStripeEvent = (payload: string): StripeWebhookEvent =>
  JSON.parse(payload) as StripeWebhookEvent;

const persistStripeEvent = async (event: PersistableStripeEvent) => {
  await db.insert(stripeEvent).values({
    eventType: event.type,
    id: crypto.randomUUID(),
    livemode: event.livemode ?? false,
    payload: event,
    processedAt: new Date(),
    status: "processed",
    stripeCreatedAt: event.created ? new Date(event.created * 1000) : null,
    stripeEventId: event.id,
  });
};

const syncInvoiceProjection = async (event: StripeWebhookEvent) => {
  const invoiceId = event.data?.object?.id;

  if (!invoiceId) {
    return;
  }

  await db
    .update(invoice)
    .set({
      hostedInvoiceUrl: event.data?.object?.hosted_invoice_url ?? undefined,
      status: event.data?.object?.status ?? undefined,
    })
    .where(eq(invoice.stripeInvoiceId, invoiceId));
};

const syncSubscriptionProjection = async (event: StripeWebhookEvent) => {
  const subscriptionId = event.data?.object?.id;

  if (!subscriptionId) {
    return;
  }

  await db
    .update(subscription)
    .set({
      status: event.data?.object?.status ?? undefined,
    })
    .where(eq(subscription.stripeSubscriptionId, subscriptionId));
};

const syncStripeProjection = async (event: StripeWebhookEvent) => {
  if (event.type?.startsWith("invoice.")) {
    await syncInvoiceProjection(event);
  }

  if (event.type?.startsWith("customer.subscription.")) {
    await syncSubscriptionProjection(event);
  }
};

app.post("/address/validate", async (c) => {
  const body = validateAddressSchema.parse(await c.req.json());
  const address = await validateAddressWithRadar(body);
  return c.json({ address });
});

app.post("/stripe/webhook", async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header("stripe-signature") ?? null;

  if (!verifyStripeWebhookSignature(payload, signature)) {
    return c.json({ error: "Invalid signature" }, 400);
  }

  const event = parseStripeEvent(payload);

  if (!event.id || !event.type) {
    return c.json({ error: "Invalid event payload" }, 400);
  }

  const persistableEvent: PersistableStripeEvent = {
    ...event,
    id: event.id,
    type: event.type,
  };

  const existingEvent = await db.query.stripeEvent.findFirst({
    where: eq(stripeEvent.stripeEventId, persistableEvent.id),
  });

  if (existingEvent) {
    return c.json({ ok: true });
  }

  await persistStripeEvent(persistableEvent);
  await syncStripeProjection(persistableEvent);

  return c.json({ ok: true });
});

export default app;
