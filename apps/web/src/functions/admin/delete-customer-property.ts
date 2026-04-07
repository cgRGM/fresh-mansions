import { db } from "@fresh-mansions/db";
import { property } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const deleteCustomerPropertySchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  propertyId: z.string().min(1, "Property is required"),
});

export const deleteCustomerProperty = createServerFn({ method: "POST" })
  .inputValidator(deleteCustomerPropertySchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const [deletedProperty] = await db
      .delete(property)
      .where(
        and(
          eq(property.customerId, data.customerId),
          eq(property.id, data.propertyId)
        )
      )
      .returning({ id: property.id });

    if (!deletedProperty) {
      throw new Error("Property not found");
    }

    return { propertyId: deletedProperty.id };
  });
