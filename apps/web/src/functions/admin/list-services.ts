import { db } from "@fresh-mansions/db";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const listServices = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () => {
    return db.query.service.findMany({
      orderBy: (table, { asc }) => [asc(table.sortOrder)],
    });
  });
