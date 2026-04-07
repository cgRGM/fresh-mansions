import { beforeEach, describe, expect, it, vi } from "vitest";

import { createUpdateChain, getMockDb, resetMockDb } from "./helpers/mock-db";

const verifyStripeWebhookSignatureMock = vi.fn();

const buildRouteModule = async () => {
  vi.doMock("../../apps/server/src/lib/stripe", () => ({
    verifyStripeWebhookSignature: verifyStripeWebhookSignatureMock,
  }));

  const routeModulePath = "../../apps/server/src/routes/integrations";
  const { default: route } = await import(routeModulePath);

  return { mockDb: getMockDb(), route };
};

describe("/api/integrations/stripe/webhook", () => {
  beforeEach(() => {
    verifyStripeWebhookSignatureMock.mockReset();
    resetMockDb();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 400 when signature is invalid", async () => {
    verifyStripeWebhookSignatureMock.mockReturnValueOnce(false);

    const { route } = await buildRouteModule();
    const response = await route.request("/stripe/webhook", {
      body: JSON.stringify({ id: "evt_1", type: "invoice.paid" }),
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=bad",
      },
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid signature" });
  });

  it("short-circuits duplicate events", async () => {
    verifyStripeWebhookSignatureMock.mockReturnValueOnce(true);

    const { mockDb, route } = await buildRouteModule();
    mockDb.query.stripeEvent.findFirst.mockResolvedValueOnce({
      id: "local_evt",
      stripeEventId: "evt_dup",
    });

    const response = await route.request("/stripe/webhook", {
      body: JSON.stringify({ id: "evt_dup", type: "invoice.paid" }),
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=ok",
      },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("persists new events and updates invoice projection", async () => {
    verifyStripeWebhookSignatureMock.mockReturnValueOnce(true);

    const { mockDb, route } = await buildRouteModule();

    mockDb.query.stripeEvent.findFirst.mockResolvedValueOnce(null);

    const insertChain = {
      values: vi.fn().mockResolvedValue(null),
    };
    const invoiceUpdate = createUpdateChain();

    mockDb.insert.mockReturnValueOnce(insertChain);
    mockDb.update.mockReturnValueOnce(invoiceUpdate.chain);

    const response = await route.request("/stripe/webhook", {
      body: JSON.stringify({
        data: {
          object: {
            hosted_invoice_url: "https://example.com/invoice/1",
            id: "in_1",
            status: "paid",
          },
        },
        id: "evt_new",
        livemode: false,
        type: "invoice.paid",
      }),
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=ok",
      },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertChain.values).toHaveBeenCalledTimes(1);
    expect(invoiceUpdate.set).toHaveBeenCalledTimes(1);
    expect(invoiceUpdate.where).toHaveBeenCalledTimes(1);
  });

  it("persists new events and updates subscription projection", async () => {
    verifyStripeWebhookSignatureMock.mockReturnValueOnce(true);

    const { mockDb, route } = await buildRouteModule();

    mockDb.query.stripeEvent.findFirst.mockResolvedValueOnce(null);

    const insertChain = {
      values: vi.fn().mockResolvedValue(null),
    };
    const subscriptionUpdate = createUpdateChain();

    mockDb.insert.mockReturnValueOnce(insertChain);
    mockDb.update.mockReturnValueOnce(subscriptionUpdate.chain);

    const response = await route.request("/stripe/webhook", {
      body: JSON.stringify({
        data: {
          object: {
            id: "sub_1",
            status: "active",
          },
        },
        id: "evt_sub",
        livemode: false,
        type: "customer.subscription.updated",
      }),
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=ok",
      },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertChain.values).toHaveBeenCalledTimes(1);
    expect(subscriptionUpdate.set).toHaveBeenCalledTimes(1);
    expect(subscriptionUpdate.where).toHaveBeenCalledTimes(1);
  });
});
