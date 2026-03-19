import { db } from "@fresh-mansions/db";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const listContractors = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () =>
    db.query.contractor.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: {
        routes: {
          with: {
            stops: true,
          },
        },
        user: true,
        workOrders: true,
      },
    })
  );
