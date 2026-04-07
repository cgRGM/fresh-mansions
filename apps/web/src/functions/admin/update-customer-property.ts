import { db } from "@fresh-mansions/db";
import { buildFullAddress } from "@fresh-mansions/db/address";
import { customer, property } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const updateCustomerPropertySchema = z.object({
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  customerId: z.string().min(1, "Customer is required"),
  formattedAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  nickname: z.string().optional(),
  propertyId: z.string().min(1, "Property is required"),
  radarMetadata: z.record(z.string(), z.unknown()).optional(),
  radarPlaceId: z.string().optional(),
  state: z.string().min(2, "State is required"),
  street: z.string().min(1, "Street is required"),
  validationStatus: z.enum(["invalid", "unverified", "validated"]),
  zip: z.string().min(5, "ZIP is required"),
});

export const updateCustomerProperty = createServerFn({ method: "POST" })
  .inputValidator(updateCustomerPropertySchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.id, data.customerId),
    });

    if (!customerRecord) {
      throw new Error("Customer not found");
    }

    const propertyRecord = await db.query.property.findFirst({
      where: and(
        eq(property.customerId, data.customerId),
        eq(property.id, data.propertyId)
      ),
    });

    if (!propertyRecord) {
      throw new Error("Property not found");
    }

    const fullAddress = buildFullAddress({
      addressLine2: data.addressLine2,
      city: data.city,
      formattedAddress: data.formattedAddress,
      state: data.state,
      street: data.street,
      zip: data.zip,
    });

    await db
      .update(property)
      .set({
        addressLine2: data.addressLine2?.trim() || null,
        addressValidationStatus: data.validationStatus,
        city: data.city,
        formattedAddress: fullAddress || data.formattedAddress || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        nickname: data.nickname?.trim() || null,
        radarMetadata: data.radarMetadata ?? null,
        radarPlaceId: data.radarPlaceId ?? null,
        state: data.state,
        street: data.street,
        zip: data.zip,
      })
      .where(eq(property.id, data.propertyId));

    return { propertyId: data.propertyId };
  });
