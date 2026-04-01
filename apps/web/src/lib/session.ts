import { auth } from "@fresh-mansions/auth";
import { db } from "@fresh-mansions/db";
import { isSuperUserEmail } from "@fresh-mansions/db/roles";
import { user } from "@fresh-mansions/db/schema/auth";
import { contractor, customer } from "@fresh-mansions/db/schema/domain";
import type { UserRole } from "@fresh-mansions/db/validators";
import { env } from "@fresh-mansions/env/server";
import { eq } from "drizzle-orm";

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export type AppSession = NonNullable<AuthSession> & {
  appUser: {
    contractorId: null | string;
    customerId: null | string;
    role: UserRole;
  };
};

export const getAppSession = async (
  headers: Headers
): Promise<AppSession | null> => {
  const session = await auth.api.getSession({ headers });

  if (!session) {
    return null;
  }

  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!userRecord) {
    return null;
  }

  const [customerRecord, contractorRecord] = await Promise.all([
    db.query.customer.findFirst({
      where: eq(customer.userId, session.user.id),
    }),
    db.query.contractor.findFirst({
      where: eq(contractor.userId, session.user.id),
    }),
  ]);

  const effectiveRole = isSuperUserEmail(
    session.user.email,
    env.SUPER_USER_EMAILS
  )
    ? "super_user"
    : (userRecord.role as UserRole);

  const resolvedCustomerRecord =
    effectiveRole === "super_user" && !customerRecord
      ? await db
          .insert(customer)
          .values({
            id: crypto.randomUUID(),
            phone: null,
            userId: session.user.id,
          })
          .returning()
          .then((records) => records[0] ?? null)
      : customerRecord;

  const resolvedContractorRecord =
    effectiveRole === "super_user" && !contractorRecord
      ? await db
          .insert(contractor)
          .values({
            contactEmail: session.user.email,
            contactPhone: null,
            displayName: session.user.name,
            id: crypto.randomUUID(),
            status: "active",
            userId: session.user.id,
          })
          .returning()
          .then((records) => records[0] ?? null)
      : contractorRecord;

  return {
    ...session,
    appUser: {
      contractorId: resolvedContractorRecord?.id ?? null,
      customerId: resolvedCustomerRecord?.id ?? null,
      role: effectiveRole,
    },
  };
};
