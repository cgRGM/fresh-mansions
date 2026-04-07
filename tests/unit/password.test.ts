import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../../packages/auth/src/password";

describe("password hashing", () => {
  it("produces a salted hash that verifies with the same password", async () => {
    const hash = await hashPassword("correct horse battery staple");

    const isValid = await verifyPassword({
      hash,
      password: "correct horse battery staple",
    });

    expect(isValid).toBe(true);
  });

  it("does not verify with a different password", async () => {
    const hash = await hashPassword("one-password");

    const isValid = await verifyPassword({
      hash,
      password: "different-password",
    });

    expect(isValid).toBe(false);
  });

  it("returns false for malformed hashes", async () => {
    await expect(
      verifyPassword({
        hash: "invalid-hash-format",
        password: "anything",
      })
    ).resolves.toBe(false);
  });
});
