import { hashPassword } from "@fresh-mansions/auth/password";
import { db } from "@fresh-mansions/db";
import { buildFullAddress } from "@fresh-mansions/db/address";
import { account, user } from "@fresh-mansions/db/schema/auth";
import { customer, property } from "@fresh-mansions/db/schema/domain";
import { customerBackfillSchema } from "@fresh-mansions/db/validators";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const generateTemporaryPassword = (): string => {
  const segment = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `Fresh-${segment}!`;
};

export const createCustomerBackfill = createServerFn({ method: "POST" })
  .inputValidator(customerBackfillSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, data.email),
    });

    if (existingUser) {
      throw new Error("A user with that email already exists");
    }

    const password = generateTemporaryPassword();
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const customerId = crypto.randomUUID();

    await db.insert(user).values({
      email: data.email,
      emailVerified: false,
      id: userId,
      name: data.name,
      role: "customer",
    });

    await db.insert(account).values({
      accountId: userId,
      id: crypto.randomUUID(),
      password: passwordHash,
      providerId: "credential",
      userId,
    });

    await db.insert(customer).values({
      id: customerId,
      phone: data.phone || null,
      userId,
    });

    let propertyId: null | string = null;

    if (data.street && data.city && data.state && data.zip) {
      propertyId = crypto.randomUUID();
      const fullAddress = buildFullAddress({
        addressLine2: data.addressLine2,
        city: data.city,
        formattedAddress: data.fullAddress || data.formattedAddress,
        state: data.state,
        street: data.street,
        zip: data.zip,
      });

      await db.insert(property).values({
        addressLine2: data.addressLine2 || null,
        addressValidationStatus: data.validationStatus,
        city: data.city,
        customerId,
        formattedAddress: fullAddress || data.formattedAddress || null,
        id: propertyId,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        nickname: data.nickname || null,
        radarMetadata: data.radarMetadata ?? null,
        radarPlaceId: data.radarPlaceId ?? null,
        state: data.state,
        street: data.street,
        zip: data.zip,
      });
    }

    return {
      customerId,
      password,
      propertyId,
      userId,
    };
  });
