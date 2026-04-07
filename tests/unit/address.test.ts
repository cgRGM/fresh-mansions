import { describe, expect, it } from "vitest";

import {
  buildFullAddress,
  withFullAddress,
} from "../../packages/db/src/address";

describe("buildFullAddress", () => {
  it("returns explicit fullAddress when present", () => {
    expect(
      buildFullAddress({
        city: "Harrisonburg",
        fullAddress: "123 Oak Street, Harrisonburg, VA 22801",
        state: "VA",
        street: "123 Oak Street",
        zip: "22801",
      })
    ).toBe("123 Oak Street, Harrisonburg, VA 22801");
  });

  it("returns formattedAddress when there is no address line 2", () => {
    expect(
      buildFullAddress({
        city: "Harrisonburg",
        formattedAddress: "123 Oak Street, Harrisonburg, VA 22801",
        state: "VA",
        street: "123 Oak Street",
        zip: "22801",
      })
    ).toBe("123 Oak Street, Harrisonburg, VA 22801");
  });

  it("builds a full address from parts including address line 2", () => {
    expect(
      buildFullAddress({
        addressLine2: "Unit B",
        city: "Harrisonburg",
        state: "VA",
        street: "123 Oak Street",
        zip: "22801",
      })
    ).toBe("123 Oak Street, Unit B, Harrisonburg, VA 22801");
  });

  it("falls back to formattedAddress when street parts are missing", () => {
    expect(
      buildFullAddress({
        formattedAddress: "Harrisonburg, VA",
      })
    ).toBe("Harrisonburg, VA");
  });

  it("returns an empty string when input is empty", () => {
    expect(buildFullAddress()).toBe("");
  });
});

describe("withFullAddress", () => {
  it("returns null for nullish input", () => {
    expect(withFullAddress()).toBeNull();
  });

  it("returns the original record with a computed fullAddress", () => {
    const result = withFullAddress({
      city: "Harrisonburg",
      id: "prop_1",
      state: "VA",
      street: "123 Oak Street",
      zip: "22801",
    });

    expect(result).toEqual({
      city: "Harrisonburg",
      fullAddress: "123 Oak Street, Harrisonburg, VA 22801",
      id: "prop_1",
      state: "VA",
      street: "123 Oak Street",
      zip: "22801",
    });
  });
});
