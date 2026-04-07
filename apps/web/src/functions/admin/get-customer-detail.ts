import { db } from "@fresh-mansions/db";
import { customer } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const getCustomerDetailSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
});

export const getCustomerDetail = createServerFn({ method: "GET" })
  .inputValidator(getCustomerDetailSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.id, data.customerId),
      with: {
        invoices: {
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        },
        properties: {
          orderBy: (table, { desc }) => [desc(table.createdAt)],
          with: {
            quotes: true,
          },
        },
        subscriptions: {
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        },
        user: true,
      },
    });

    if (!customerRecord) {
      return null;
    }

    return {
      ...customerRecord,
      properties: customerRecord.properties.map((propertyRecord) => ({
        ...propertyRecord,
        radarMetadata:
          typeof propertyRecord.radarMetadata === "object" &&
          propertyRecord.radarMetadata !== null
            ? propertyRecord.radarMetadata
            : {},
      })),
    };
  });
