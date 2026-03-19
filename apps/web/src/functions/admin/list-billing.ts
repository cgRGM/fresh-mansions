import { db } from "@fresh-mansions/db";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const listBilling = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () => {
    const [invoices, subscriptions] = await Promise.all([
      db.query.invoice.findMany({
        orderBy: (table, { desc }) => [desc(table.createdAt)],
        with: {
          customer: {
            with: {
              user: true,
            },
          },
          workOrder: true,
        },
      }),
      db.query.subscription.findMany({
        orderBy: (table, { desc }) => [desc(table.createdAt)],
        with: {
          customer: {
            with: {
              user: true,
            },
          },
        },
      }),
    ]);

    return {
      invoices,
      subscriptions,
    };
  });
