import { describe, expect, it } from "vitest";

import {
  hasRoleAccess,
  isSuperUserEmail,
  parseSuperUserEmails,
} from "../../packages/db/src/roles";

describe("role helpers", () => {
  it("parses and normalizes super user email list", () => {
    const emails = parseSuperUserEmails("ADMIN@EXAMPLE.COM, ops@example.com ");

    expect(emails.has("admin@example.com")).toBe(true);
    expect(emails.has("ops@example.com")).toBe(true);
  });

  it("checks super user email by normalized match", () => {
    expect(
      isSuperUserEmail(
        "Admin@Example.com",
        "admin@example.com,other@example.com"
      )
    ).toBe(true);
  });

  it("allows super_user to access any protected role route", () => {
    expect(hasRoleAccess("super_user", ["admin"])).toBe(true);
  });

  it("denies roles that are not in allowed roles", () => {
    expect(hasRoleAccess("customer", ["admin", "contractor"])).toBe(false);
  });
});
