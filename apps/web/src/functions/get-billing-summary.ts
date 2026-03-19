import { db } from "@fresh-mansions/db";
import { customer } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { authMiddleware } from "@/middleware/auth";

export const getBillingSummary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { customerId } = context.session.appUser;

    if (!customerId) {
      return {
        invoices: [],
        subscriptions: [],
      };
    }

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.id, customerId),
      with: {
        invoices: {
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        },
        subscriptions: {
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        },
      },
    });

    return {
      invoices: customerRecord?.invoices ?? [],
      subscriptions: customerRecord?.subscriptions ?? [],
    };
  });
