import { describe, expect, it } from "vitest";

import { buildNormalizedAddressKey } from "../../packages/db/src/address-dedupe";

describe("buildNormalizedAddressKey", () => {
  it("normalizes punctuation, case, and zip extensions", () => {
    expect(
      buildNormalizedAddressKey({
        city: "Harrisonburg",
        state: "VA",
        street: "123 Main St.",
        zip: "22801-1234",
      })
    ).toBe("123 main st|harrisonburg|va|22801");
  });

  it("normalizes common unit prefixes", () => {
    expect(
      buildNormalizedAddressKey({
        addressLine2: "Suite 200",
        city: "Rockingham",
        state: "VA",
        street: "45 Court Sq",
        zip: "22801",
      })
    ).toBe("45 court sq|200|rockingham|va|22801");
  });

  it("falls back to formatted address when structured parts are missing", () => {
    expect(
      buildNormalizedAddressKey({
        formattedAddress: "123 Main Street, Harrisonburg, VA 22801",
      })
    ).toBe("123 main street harrisonburg va 22801");
  });
});
