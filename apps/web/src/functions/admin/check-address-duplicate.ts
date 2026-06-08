import { db } from "@fresh-mansions/db";
import { buildFullAddress } from "@fresh-mansions/db/address";
import { buildNormalizedAddressKey } from "@fresh-mansions/db/address-dedupe";
import { property } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const checkAddressDuplicateSchema = z.object({
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  customerId: z.string().optional(),
  formattedAddress: z.string().optional(),
  radarPlaceId: z.string().optional(),
  state: z.string().min(2),
  street: z.string().min(1),
  zip: z.string().min(5),
});

export const checkAddressDuplicate = createServerFn({ method: "POST" })
  .inputValidator(checkAddressDuplicateSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const addressInput = {
      addressLine2: data.addressLine2,
      city: data.city,
      formattedAddress: data.formattedAddress,
      state: data.state,
      street: data.street,
      zip: data.zip,
    };
    const normalizedAddressKey = buildNormalizedAddressKey(addressInput);
    const duplicate = await db.query.property.findFirst({
      where: data.radarPlaceId
        ? or(
            eq(property.radarPlaceId, data.radarPlaceId),
            eq(property.normalizedAddressKey, normalizedAddressKey)
          )
        : eq(property.normalizedAddressKey, normalizedAddressKey),
      with: {
        customer: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!duplicate) {
      return { duplicate: null };
    }

    return {
      duplicate: {
        customerId: duplicate.customerId,
        customerName: duplicate.customer?.user?.name ?? null,
        formattedAddress: buildFullAddress(duplicate),
        isSameCustomer: duplicate.customerId === data.customerId,
        propertyId: duplicate.id,
      },
    };
  });
