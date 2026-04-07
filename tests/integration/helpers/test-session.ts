import type { AppSession } from "../../../apps/server/src/lib/session";

type Role = AppSession["appUser"]["role"];

export const createSession = (input: {
  contractorId?: null | string;
  customerId?: null | string;
  role: Role;
  userEmail?: string;
  userId?: string;
}): AppSession => ({
  appUser: {
    contractorId: input.contractorId ?? null,
    customerId: input.customerId ?? null,
    role: input.role,
  },
  session: {
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    id: "session_test",
    ipAddress: "127.0.0.1",
    token: "token_test",
    updatedAt: new Date(),
    userAgent: "vitest",
    userId: input.userId ?? "user_test",
  },
  user: {
    createdAt: new Date(),
    email: input.userEmail ?? "user@example.com",
    emailVerified: true,
    id: input.userId ?? "user_test",
    image: null,
    name: "Test User",
    updatedAt: new Date(),
  },
});
