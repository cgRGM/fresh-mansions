import { db } from "@fresh-mansions/db";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const listWorkOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () =>
    db.query.workOrder.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: {
        contractor: true,
        invoice: true,
        quote: {
          with: {
            customer: {
              with: {
                user: true,
              },
            },
            property: true,
          },
        },
      },
    })
  );
