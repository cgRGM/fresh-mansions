import { db } from "@fresh-mansions/db";
import { user } from "@fresh-mansions/db/schema/auth";
import { customer } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const updateCustomerProfileSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  email: z.email("Enter a valid email"),
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
});

export const updateCustomerProfile = createServerFn({ method: "POST" })
  .inputValidator(updateCustomerProfileSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.id, data.customerId),
      with: {
        user: true,
      },
    });

    if (!customerRecord?.user) {
      throw new Error("Customer not found");
    }

    const existingUserWithEmail = await db.query.user.findFirst({
      where: and(
        eq(user.email, data.email),
        ne(user.id, customerRecord.user.id)
      ),
    });

    if (existingUserWithEmail) {
      throw new Error("A user with that email already exists");
    }

    await db
      .update(user)
      .set({
        email: data.email,
        name: data.name,
      })
      .where(eq(user.id, customerRecord.user.id));

    await db
      .update(customer)
      .set({
        phone: data.phone?.trim() || null,
      })
      .where(eq(customer.id, data.customerId));

    return { customerId: data.customerId };
  });
