import { db } from "@fresh-mansions/db";
import { buildFullAddress } from "@fresh-mansions/db/address";
import { customer, property } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const addCustomerPropertySchema = z.object({
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  customerId: z.string().min(1, "Customer is required"),
  formattedAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  nickname: z.string().optional(),
  radarMetadata: z.record(z.string(), z.unknown()).optional(),
  radarPlaceId: z.string().optional(),
  state: z.string().min(2, "State is required"),
  street: z.string().min(1, "Street is required"),
  validationStatus: z.enum(["invalid", "unverified", "validated"]),
  zip: z.string().min(5, "ZIP is required"),
});

export const addCustomerProperty = createServerFn({ method: "POST" })
  .inputValidator(addCustomerPropertySchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.id, data.customerId),
    });

    if (!customerRecord) {
      throw new Error("Customer not found");
    }

    const propertyId = crypto.randomUUID();
    const fullAddress = buildFullAddress({
      addressLine2: data.addressLine2,
      city: data.city,
      formattedAddress: data.formattedAddress,
      state: data.state,
      street: data.street,
      zip: data.zip,
    });

    await db.insert(property).values({
      addressLine2: data.addressLine2?.trim() || null,
      addressValidationStatus: data.validationStatus,
      city: data.city,
      customerId: data.customerId,
      formattedAddress: fullAddress || data.formattedAddress || null,
      id: propertyId,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      nickname: data.nickname?.trim() || null,
      radarMetadata: data.radarMetadata ?? null,
      radarPlaceId: data.radarPlaceId ?? null,
      state: data.state,
      street: data.street,
      zip: data.zip,
    });

    return { propertyId };
  });
