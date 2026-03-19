import { db } from "@fresh-mansions/db";
import { user } from "@fresh-mansions/db/schema/auth";
import { contractor, customer } from "@fresh-mansions/db/schema/domain";
import type { UserRole } from "@fresh-mansions/db/validators";
import { eq } from "drizzle-orm";

import { authClient } from "@/lib/auth-client";

type AuthSession = Awaited<ReturnType<typeof authClient.getSession>>;

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
  const session = await authClient.getSession({
    fetchOptions: {
      headers,
      throw: true,
    },
  });

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

  return {
    ...session,
    appUser: {
      contractorId: contractorRecord?.id ?? null,
      customerId: customerRecord?.id ?? null,
      role: userRecord.role as UserRole,
    },
  };
};
