import { db } from "@fresh-mansions/db";
import { account, user } from "@fresh-mansions/db/schema/auth";
import {
  contractor,
  customer,
  invoice,
  property,
  quote,
  route,
  routeStop,
  subscription,
  stripeEvent,
  workOrder,
} from "@fresh-mansions/db/schema/domain";
import {
  contractorInviteSchema,
  customerBackfillSchema,
  invoiceCreateSchema,
  routeStopUpsertSchema,
  routeUpsertSchema,
  subscriptionCreateSchema,
  workOrderAssignmentSchema,
} from "@fresh-mansions/db/validators";
import { env } from "@fresh-mansions/env/server";
import { hashPassword } from "better-auth/crypto";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { validateAddressWithRadar } from "../lib/radar";
import {
  createStripeAccountLink,
  createStripeConnectedAccount,
  createStripeInvoice,
  createStripeSubscription,
  ensureStripeCustomer,
} from "../lib/stripe";
import { requireAuth, requireRole } from "../middleware/auth";

const app = new Hono();

const scheduleVisitSchema = z.object({
  scheduledVisitAt: z.string().min(1),
});

const finalizeQuoteSchema = z
  .object({
    estimateHigh: z.number().int().positive(),
    estimateLow: z.number().int().positive(),
  })
  .refine((value) => value.estimateHigh >= value.estimateLow, {
    message: "estimateHigh must be greater than or equal to estimateLow",
    path: ["estimateHigh"],
  });

const updateQuoteStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "quote_ready", "visit_scheduled"]),
});

const reorderStopsSchema = z.object({
  stops: z.array(
    z.object({
      id: z.string(),
      sequence: z.number().int().nonnegative(),
    })
  ),
});

const generateTemporaryPassword = (): string => {
  const segment = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `Fresh-${segment}!`;
};

const getStripeCustomerId = async (customerId: string) => {
  const [existingInvoice, existingSubscription, customerRecord] =
    await Promise.all([
      db.query.invoice.findFirst({
        where: eq(invoice.customerId, customerId),
      }),
      db.query.subscription.findFirst({
        where: eq(subscription.customerId, customerId),
      }),
      db.query.customer.findFirst({
        where: eq(customer.id, customerId),
        with: {
          user: true,
        },
      }),
    ]);

  const cachedStripeCustomerId =
    existingInvoice?.stripeCustomerId ?? existingSubscription?.stripeCustomerId;

  if (cachedStripeCustomerId) {
    return cachedStripeCustomerId;
  }

  if (!customerRecord?.user) {
    throw new Error("Customer not found");
  }

  const stripeCustomer = await ensureStripeCustomer({
    email: customerRecord.user.email,
    name: customerRecord.user.name,
    phone: customerRecord.phone,
  });

  return stripeCustomer?.customerId ?? null;
};

app.use("*", requireAuth);
app.use("*", requireRole("admin"));

app.get("/quotes", async (c) => {
  const quoteRecords = await db.query.quote.findMany({
    orderBy: [desc(quote.createdAt)],
    with: {
      customer: {
        with: {
          user: true,
        },
      },
      photos: true,
      property: true,
      workOrders: {
        with: {
          contractor: true,
        },
      },
    },
  });

  return c.json({ quotes: quoteRecords });
});

app.get("/quotes/:id", async (c) => {
  const quoteId = c.req.param("id");
  const quoteRecord = await db.query.quote.findFirst({
    where: eq(quote.id, quoteId),
    with: {
      customer: {
        with: {
          user: true,
        },
      },
      photos: true,
      property: true,
      workOrders: {
        with: {
          contractor: true,
        },
      },
    },
  });

  if (!quoteRecord) {
    return c.json({ error: "Quote not found" }, 404);
  }

  return c.json({ quote: quoteRecord });
});

app.patch("/quotes/:id/status", async (c) => {
  const quoteId = c.req.param("id");
  const body = updateQuoteStatusSchema.parse(await c.req.json());
  const [updatedQuote] = await db
    .update(quote)
    .set({
      status: body.status,
    })
    .where(eq(quote.id, quoteId))
    .returning();

  if (!updatedQuote) {
    return c.json({ error: "Quote not found" }, 404);
  }

  return c.json({ quote: updatedQuote });
});

app.patch("/quotes/:id/schedule", async (c) => {
  const quoteId = c.req.param("id");
  const body = scheduleVisitSchema.parse(await c.req.json());
  const [updatedQuote] = await db
    .update(quote)
    .set({
      scheduledVisitAt: new Date(body.scheduledVisitAt),
      status: "visit_scheduled",
    })
    .where(eq(quote.id, quoteId))
    .returning();

  if (!updatedQuote) {
    return c.json({ error: "Quote not found" }, 404);
  }

  return c.json({ quote: updatedQuote });
});

app.patch("/quotes/:id/finalize", async (c) => {
  const quoteId = c.req.param("id");
  const body = finalizeQuoteSchema.parse(await c.req.json());
  const [updatedQuote] = await db
    .update(quote)
    .set({
      estimateHigh: body.estimateHigh,
      estimateLow: body.estimateLow,
      finalizedAt: new Date(),
      status: "quote_ready",
    })
    .where(eq(quote.id, quoteId))
    .returning();

  if (!updatedQuote) {
    return c.json({ error: "Quote not found" }, 404);
  }

  return c.json({ quote: updatedQuote });
});

app.post("/quotes/:id/convert", async (c) => {
  const quoteId = c.req.param("id");
  const quoteRecord = await db.query.quote.findFirst({
    where: eq(quote.id, quoteId),
  });

  if (!quoteRecord) {
    return c.json({ error: "Quote not found" }, 404);
  }

  if (quoteRecord.status === "converted") {
    return c.json({ error: "Quote already converted" }, 400);
  }

  const workOrderId = crypto.randomUUID();

  await db.insert(workOrder).values({
    contractorId: null,
    id: workOrderId,
    notes: quoteRecord.notes,
    quoteId: quoteRecord.id,
    scheduledDate: quoteRecord.preferredStartDate,
    status: "pending",
  });

  await db
    .update(quote)
    .set({ status: "converted" })
    .where(eq(quote.id, quoteId));

  return c.json({ workOrderId }, 201);
});

app.get("/customers", async (c) => {
  const customerRecords = await db.query.customer.findMany({
    orderBy: [desc(customer.createdAt)],
    with: {
      invoices: true,
      properties: true,
      subscriptions: true,
      user: true,
    },
  });

  return c.json({ customers: customerRecords });
});

app.post("/customers", async (c) => {
  const body = customerBackfillSchema.parse(await c.req.json());
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, body.email),
  });

  if (existingUser) {
    return c.json({ error: "A user with that email already exists" }, 409);
  }

  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();
  const customerId = crypto.randomUUID();

  await db.insert(user).values({
    email: body.email,
    emailVerified: false,
    id: userId,
    name: body.name,
    role: "customer",
  });

  await db.insert(account).values({
    accountId: userId,
    id: crypto.randomUUID(),
    password: passwordHash,
    providerId: "credential",
    userId,
  });

  await db.insert(customer).values({
    id: customerId,
    phone: body.phone ?? null,
    userId,
  });

  let propertyId: null | string = null;

  if (body.street && body.city && body.state && body.zip) {
    propertyId = crypto.randomUUID();
    await db.insert(property).values({
      addressLine2: body.addressLine2 ?? null,
      addressValidationStatus: body.validationStatus,
      city: body.city,
      customerId,
      formattedAddress: body.formattedAddress ?? null,
      id: propertyId,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      nickname: body.nickname ?? null,
      radarMetadata: body.radarMetadata ?? null,
      radarPlaceId: body.radarPlaceId ?? null,
      state: body.state,
      street: body.street,
      zip: body.zip,
    });
  }

  return c.json({ customerId, password, propertyId, userId }, 201);
});

app.get("/contractors", async (c) => {
  const contractors = await db.query.contractor.findMany({
    orderBy: [desc(contractor.createdAt)],
    with: {
      routes: {
        with: {
          stops: true,
        },
      },
      user: true,
      workOrders: true,
    },
  });

  return c.json({ contractors });
});

app.post("/contractors", async (c) => {
  const body = contractorInviteSchema.parse(await c.req.json());
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, body.contactEmail),
  });

  if (existingUser) {
    return c.json({ error: "A user with that email already exists" }, 409);
  }

  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();
  const contractorId = crypto.randomUUID();

  await db.insert(user).values({
    email: body.contactEmail,
    emailVerified: false,
    id: userId,
    name: body.displayName,
    role: "contractor",
  });

  await db.insert(account).values({
    accountId: userId,
    id: crypto.randomUUID(),
    password: passwordHash,
    providerId: "credential",
    userId,
  });

  const stripeAccount = await createStripeConnectedAccount({
    email: body.contactEmail,
  });

  await db.insert(contractor).values({
    contactEmail: body.contactEmail,
    contactPhone: body.contactPhone ?? null,
    displayName: body.displayName,
    id: contractorId,
    status: "invited",
    stripeAccountId: stripeAccount?.accountId ?? null,
    stripeAccountStatus: stripeAccount ? "pending" : "not_started",
    userId,
  });

  return c.json(
    {
      contractorId,
      password,
      stripeAccountId: stripeAccount?.accountId ?? null,
      userId,
    },
    201
  );
});

app.post("/contractors/:id/onboarding-link", async (c) => {
  const contractorId = c.req.param("id");
  const contractorRecord = await db.query.contractor.findFirst({
    where: eq(contractor.id, contractorId),
  });

  if (!contractorRecord) {
    return c.json({ error: "Contractor not found" }, 404);
  }

  if (!contractorRecord.stripeAccountId) {
    return c.json({ error: "Contractor is missing a Stripe account" }, 400);
  }

  const baseUrl = env.BETTER_AUTH_URL.replace(/\/$/, "");
  const onboardingLink = await createStripeAccountLink({
    accountId: contractorRecord.stripeAccountId,
    refreshUrl: `${baseUrl}/admin/contractors`,
    returnUrl: `${baseUrl}/contractor`,
  });

  if (!onboardingLink?.url) {
    return c.json({ onboardingUrl: null, status: "pending" }, 200);
  }

  return c.json({ onboardingUrl: onboardingLink.url }, 200);
});

app.get("/work-orders", async (c) => {
  const workOrders = await db.query.workOrder.findMany({
    orderBy: [desc(workOrder.createdAt)],
    with: {
      contractor: true,
      invoice: true,
      quote: {
        with: {
          customer: {
            with: {
              user: true,
            },
          },
          property: true,
        },
      },
    },
  });

  return c.json({ workOrders });
});

app.post("/work-orders/:id/assign", async (c) => {
  const workOrderId = c.req.param("id");
  const body = workOrderAssignmentSchema.parse({
    ...(await c.req.json()),
    workOrderId,
  });

  const [updatedWorkOrder] = await db
    .update(workOrder)
    .set({
      contractorId: body.contractorId,
      scheduledDate: body.scheduledDate ?? undefined,
      status: "assigned",
    })
    .where(eq(workOrder.id, workOrderId))
    .returning();

  if (!updatedWorkOrder) {
    return c.json({ error: "Work order not found" }, 404);
  }

  if (body.routeId) {
    const existingStop = await db.query.routeStop.findFirst({
      where: eq(routeStop.workOrderId, workOrderId),
    });

    if (!existingStop) {
      const routeRecord = await db.query.route.findFirst({
        where: eq(route.id, body.routeId),
        with: {
          stops: true,
        },
      });

      if (!routeRecord) {
        return c.json({ error: "Route not found" }, 404);
      }

      await db.insert(routeStop).values({
        id: crypto.randomUUID(),
        routeId: routeRecord.id,
        sequence: routeRecord.stops.length,
        workOrderId,
      });
    }
  }

  return c.json({ workOrder: updatedWorkOrder });
});

app.get("/routes", async (c) => {
  const routes = await db.query.route.findMany({
    orderBy: [desc(route.routeDate)],
    with: {
      contractor: true,
      stops: {
        with: {
          workOrder: {
            with: {
              contractor: true,
              quote: {
                with: {
                  customer: {
                    with: {
                      user: true,
                    },
                  },
                  property: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return c.json({ routes });
});

app.post("/routes", async (c) => {
  const body = routeUpsertSchema.parse(await c.req.json());
  const routeId = crypto.randomUUID();
  await db.insert(route).values({
    contractorId: body.contractorId ?? null,
    id: routeId,
    name: body.name,
    routeDate: body.routeDate,
    status: body.status,
  });

  return c.json({ routeId }, 201);
});

app.post("/routes/:id/stops", async (c) => {
  const routeId = c.req.param("id");
  const body = routeStopUpsertSchema.parse({
    ...(await c.req.json()),
    routeId,
  });

  const stopId = crypto.randomUUID();
  await db.insert(routeStop).values({
    id: stopId,
    notes: body.notes ?? null,
    routeId,
    sequence: body.sequence,
    status: body.status,
    workOrderId: body.workOrderId,
  });

  return c.json({ stopId }, 201);
});

app.patch("/routes/:id/stops/reorder", async (c) => {
  const body = reorderStopsSchema.parse(await c.req.json());

  for (const stop of body.stops) {
    await db
      .update(routeStop)
      .set({ sequence: stop.sequence })
      .where(eq(routeStop.id, stop.id));
  }

  return c.json({ ok: true });
});

app.get("/invoices", async (c) => {
  const invoices = await db.query.invoice.findMany({
    orderBy: [desc(invoice.createdAt)],
    with: {
      customer: {
        with: {
          user: true,
        },
      },
      workOrder: {
        with: {
          contractor: true,
        },
      },
    },
  });

  return c.json({ invoices });
});

app.post("/invoices", async (c) => {
  const body = invoiceCreateSchema.parse(await c.req.json());
  const invoiceId = crypto.randomUUID();
  const stripeCustomerId = await getStripeCustomerId(body.customerId);
  const stripeInvoice = stripeCustomerId
    ? await createStripeInvoice({
        amountDue: body.amountDue,
        currency: body.currency,
        customerId: stripeCustomerId,
        description: body.note,
        dueDate: body.dueDate,
      })
    : null;

  await db.insert(invoice).values({
    amountDue: body.amountDue,
    currency: body.currency,
    customerId: body.customerId,
    dueDate: body.dueDate ?? null,
    hostedInvoiceUrl: stripeInvoice?.hostedInvoiceUrl ?? null,
    id: invoiceId,
    note: body.note ?? null,
    status: stripeInvoice ? "open" : "draft",
    stripeCustomerId,
    stripeInvoiceId: stripeInvoice?.invoiceId ?? null,
    workOrderId: body.workOrderId ?? null,
  });

  return c.json({ invoiceId }, 201);
});

app.get("/subscriptions", async (c) => {
  const subscriptions = await db.query.subscription.findMany({
    orderBy: [desc(subscription.createdAt)],
    with: {
      customer: {
        with: {
          user: true,
        },
      },
    },
  });

  return c.json({ subscriptions });
});

app.post("/subscriptions", async (c) => {
  const body = subscriptionCreateSchema.parse(await c.req.json());
  const subscriptionId = crypto.randomUUID();
  const stripeCustomerId = await getStripeCustomerId(body.customerId);
  const stripeSubscription = stripeCustomerId
    ? await createStripeSubscription({
        customerId: stripeCustomerId,
        interval: body.interval,
        intervalCount: body.intervalCount,
        nickname: body.nickname,
        priceCents: body.priceCents,
      })
    : null;

  await db.insert(subscription).values({
    currency: body.currency,
    customerId: body.customerId,
    id: subscriptionId,
    interval: body.interval,
    intervalCount: body.intervalCount,
    nickname: body.nickname ?? null,
    priceCents: body.priceCents,
    status: stripeSubscription ? "active" : "draft",
    stripeCustomerId,
    stripePriceId: stripeSubscription?.priceId ?? null,
    stripeSubscriptionId: stripeSubscription?.subscriptionId ?? null,
  });

  return c.json({ subscriptionId }, 201);
});

app.post("/subscriptions/:id/cancel", async (c) => {
  const subscriptionId = c.req.param("id");
  const [updatedSubscription] = await db
    .update(subscription)
    .set({
      status: "cancelled",
    })
    .where(eq(subscription.id, subscriptionId))
    .returning();

  if (!updatedSubscription) {
    return c.json({ error: "Subscription not found" }, 404);
  }

  return c.json({ subscription: updatedSubscription });
});

app.get("/stripe-events", async (c) => {
  const events = await db.query.stripeEvent.findMany({
    orderBy: [desc(stripeEvent.createdAt)],
  });

  return c.json({ events });
});

app.post("/address/validate", async (c) => {
  const body = customerBackfillSchema
    .pick({
      addressLine2: true,
      city: true,
      state: true,
      street: true,
      zip: true,
    })
    .parse(await c.req.json());

  const validatedAddress = await validateAddressWithRadar({
    addressLine2: body.addressLine2,
    city: body.city ?? "",
    state: body.state ?? "",
    street: body.street ?? "",
    zip: body.zip ?? "",
  });

  return c.json({ address: validatedAddress });
});

export default app;
