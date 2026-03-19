import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@fresh-mansions/env/server";

type StripeRecord = Record<string, string | number | undefined>;

const buildFormBody = (payload: StripeRecord): URLSearchParams => {
  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      continue;
    }

    body.set(key, String(value));
  }

  return body;
};

const stripeRequest = async <T>(
  path: string,
  payload: StripeRecord
): Promise<T | null> => {
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    body: buildFormBody(payload),
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Stripe request failed for ${path}`);
  }

  return (await response.json()) as T;
};

export const createStripeConnectedAccount = async (input: {
  email: string;
}): Promise<null | {
  accountId: string;
}> => {
  const response = await stripeRequest<{ id: string }>("accounts", {
    "capabilities[card_payments][requested]": "true",
    "capabilities[transfers][requested]": "true",
    country: "US",
    email: input.email,
    type: "express",
  });

  if (!response) {
    return null;
  }

  return {
    accountId: response.id,
  };
};

export const createStripeAccountLink = async (input: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<null | { url: string }> => {
  const response = await stripeRequest<{ url: string }>("account_links", {
    account: input.accountId,
    refresh_url: input.refreshUrl,
    return_url: input.returnUrl,
    type: "account_onboarding",
  });

  if (!response) {
    return null;
  }

  return {
    url: response.url,
  };
};

export const ensureStripeCustomer = async (input: {
  email: string;
  name: string;
  phone?: string | null;
}): Promise<null | { customerId: string }> => {
  const response = await stripeRequest<{ id: string }>("customers", {
    email: input.email,
    name: input.name,
    phone: input.phone ?? undefined,
  });

  if (!response) {
    return null;
  }

  return {
    customerId: response.id,
  };
};

export const createStripeInvoice = async (input: {
  amountDue: number;
  currency: string;
  customerId: string;
  description?: string;
  dueDate?: string;
}): Promise<null | { hostedInvoiceUrl?: string; invoiceId: string }> => {
  const item = await stripeRequest<{ id: string }>("invoiceitems", {
    amount: input.amountDue,
    currency: input.currency,
    customer: input.customerId,
    description: input.description,
  });

  if (!item) {
    return null;
  }

  const invoice = await stripeRequest<{
    hosted_invoice_url?: string;
    id: string;
  }>("invoices", {
    auto_advance: "true",
    collection_method: input.dueDate ? "send_invoice" : "charge_automatically",
    customer: input.customerId,
    due_date: input.dueDate
      ? Math.floor(new Date(input.dueDate).getTime() / 1000)
      : undefined,
  });

  if (!invoice) {
    return null;
  }

  return {
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    invoiceId: invoice.id,
  };
};

export const createStripeSubscription = async (input: {
  customerId: string;
  interval: "month" | "week";
  intervalCount: number;
  nickname?: string;
  priceCents: number;
}): Promise<null | { priceId: string; subscriptionId: string }> => {
  const price = await stripeRequest<{ id: string }>("prices", {
    currency: "usd",
    "product_data[name]": input.nickname ?? "FreshMansions service plan",
    "recurring[interval]": input.interval,
    "recurring[interval_count]": input.intervalCount,
    unit_amount: input.priceCents,
  });

  if (!price) {
    return null;
  }

  const subscription = await stripeRequest<{ id: string }>("subscriptions", {
    customer: input.customerId,
    "items[0][price]": price.id,
  });

  if (!subscription) {
    return null;
  }

  return {
    priceId: price.id,
    subscriptionId: subscription.id,
  };
};

export const verifyStripeWebhookSignature = (
  payload: string,
  signatureHeader: null | string
): boolean => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(",");
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.replace("t=", "");
  const signature = parts
    .find((part) => part.startsWith("v1="))
    ?.replace("v1=", "");

  if (!timestamp || !signature) {
    return false;
  }

  const computedSignature = createHmac("sha256", env.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
};
