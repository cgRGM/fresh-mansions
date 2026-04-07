import { db } from "@fresh-mansions/db";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () => {
    const customers = await db.query.customer.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: {
        properties: true,
        subscriptions: true,
        user: true,
      },
    });

    return customers.map((customerRecord) => ({
      ...customerRecord,
      properties: customerRecord.properties.map((propertyRecord) => ({
        ...propertyRecord,
        radarMetadata:
          typeof propertyRecord.radarMetadata === "object" &&
          propertyRecord.radarMetadata !== null
            ? propertyRecord.radarMetadata
            : {},
      })),
    }));
  });
