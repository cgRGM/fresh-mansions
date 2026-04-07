import { describe, expect, it } from "vitest";

import {
  customerBackfillSchema,
  quoteIntakeSchema,
} from "../../packages/db/src/validators";

describe("quoteIntakeSchema", () => {
  it("accepts valid existing property quote payload", () => {
    const result = quoteIntakeSchema.safeParse({
      endDate: "2026-05-05",
      notes: "Please avoid the flower bed.",
      preferredVisitTime: "afternoon",
      propertyId: "prop_123",
      serviceType: "mowing",
      startDate: "2026-05-01",
    });

    expect(result.success).toBe(true);
  });

  it("rejects when date window is inverted", () => {
    const result = quoteIntakeSchema.safeParse({
      endDate: "2026-05-01",
      preferredVisitTime: "09:30",
      propertyId: "prop_123",
      serviceType: "mowing",
      startDate: "2026-05-05",
    });

    expect(result.success).toBe(false);
  });

  it("requires validated fields for new property quote payload", () => {
    const result = quoteIntakeSchema.safeParse({
      city: "Harrisonburg",
      endDate: "2026-05-05",
      latitude: 38.4496,
      longitude: -78.8689,
      preferredVisitTime: "morning",
      serviceType: "cleanup",
      startDate: "2026-05-01",
      state: "VA",
      street: "123 Oak Street",
      validationStatus: "validated",
      zip: "22801",
    });

    expect(result.success).toBe(false);
  });
});

describe("customerBackfillSchema", () => {
  it("accepts customer with no address", () => {
    const result = customerBackfillSchema.safeParse({
      email: "new@example.com",
      name: "New Customer",
    });

    expect(result.success).toBe(true);
  });

  it("rejects partial address payload", () => {
    const result = customerBackfillSchema.safeParse({
      city: "Harrisonburg",
      email: "new@example.com",
      name: "New Customer",
      street: "123 Oak Street",
    });

    expect(result.success).toBe(false);
  });
});
