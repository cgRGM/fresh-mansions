import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

const signPayload = ({
  payload,
  secret,
  timestamp,
}: {
  payload: string;
  secret: string;
  timestamp: string;
}): string => {
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
};

describe("verifyStripeWebhookSignature", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "";
    vi.resetModules();
  });

  it("accepts a valid signature", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "unit-test-secret";
    const { verifyStripeWebhookSignature } =
      await import("../../apps/server/src/lib/stripe");
    const payload = JSON.stringify({ id: "evt_123", type: "invoice.paid" });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    const signatureHeader = signPayload({
      payload,
      secret,
      timestamp,
    });

    expect(verifyStripeWebhookSignature(payload, signatureHeader)).toBe(true);
  });

  it("rejects a tampered signature", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "unit-test-secret";
    const { verifyStripeWebhookSignature } =
      await import("../../apps/server/src/lib/stripe");
    const payload = JSON.stringify({ id: "evt_123", type: "invoice.paid" });
    const timestamp = "1700000000";

    const signatureHeader = `t=${timestamp},v1=${"0".repeat(64)}`;

    expect(verifyStripeWebhookSignature(payload, signatureHeader)).toBe(false);
  });

  it("rejects when signature header is missing", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "unit-test-secret";
    const { verifyStripeWebhookSignature } =
      await import("../../apps/server/src/lib/stripe");
    expect(verifyStripeWebhookSignature("{}", null)).toBe(false);
  });
});
