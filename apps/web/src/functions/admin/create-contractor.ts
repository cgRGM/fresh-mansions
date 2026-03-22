import { hashPassword } from "@fresh-mansions/auth/password";
import { db } from "@fresh-mansions/db";
import { account, user } from "@fresh-mansions/db/schema/auth";
import { contractor } from "@fresh-mansions/db/schema/domain";
import { contractorInviteSchema } from "@fresh-mansions/db/validators";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const generateTemporaryPassword = (): string => {
  const segment = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `Fresh-${segment}!`;
};

export const createContractor = createServerFn({ method: "POST" })
  .inputValidator(contractorInviteSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, data.contactEmail),
    });

    if (existingUser) {
      throw new Error("A user with that email already exists");
    }

    const password = generateTemporaryPassword();
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const contractorId = crypto.randomUUID();

    await db.insert(user).values({
      email: data.contactEmail,
      emailVerified: false,
      id: userId,
      name: data.displayName,
      role: "contractor",
    });

    await db.insert(account).values({
      accountId: userId,
      id: crypto.randomUUID(),
      password: passwordHash,
      providerId: "credential",
      userId,
    });

    await db.insert(contractor).values({
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone ?? null,
      displayName: data.displayName,
      id: contractorId,
      status: "invited",
      userId,
    });

    return {
      contractorId,
      password,
      userId,
    };
  });
