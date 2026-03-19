import { db } from "@fresh-mansions/db";
import { customer, property, quote } from "@fresh-mansions/db/schema/domain";
import { quoteIntakeSchema } from "@fresh-mansions/db/validators";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { authMiddleware } from "@/middleware/auth";

export const createQuoteIntake = createServerFn({ method: "POST" })
  .inputValidator(quoteIntakeSchema)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const userId = context.session.user.id;
    const existingCustomerId = context.session.appUser.customerId;

    // Upsert customer
    let existingCustomer = existingCustomerId
      ? await db.query.customer.findFirst({
          where: eq(customer.id, existingCustomerId),
        })
      : await db.query.customer.findFirst({
          where: eq(customer.userId, userId),
        });

    if (!existingCustomer) {
      const customerId = crypto.randomUUID();
      await db.insert(customer).values({
        id: customerId,
        phone: data.phone || null,
        userId,
      });
      existingCustomer = { id: customerId } as typeof existingCustomer;
    } else if (data.phone) {
      await db
        .update(customer)
        .set({ phone: data.phone })
        .where(eq(customer.id, existingCustomer.id));
    }

    const customerId = existingCustomer?.id;
    if (!customerId) {
      throw new Error("Customer record missing after upsert");
    }

    // Create property
    const propertyId = crypto.randomUUID();
    await db.insert(property).values({
      addressLine2: data.addressLine2 || null,
      addressValidationStatus: data.validationStatus,
      city: data.city,
      customerId,
      formattedAddress: data.formattedAddress ?? null,
      id: propertyId,
      latitude: data.latitude,
      longitude: data.longitude,
      nickname: data.nickname || null,
      radarMetadata: data.radarMetadata ?? null,
      radarPlaceId: data.radarPlaceId ?? null,
      state: data.state,
      street: data.street,
      zip: data.zip,
    });

    const quoteId = crypto.randomUUID();
    await db.insert(quote).values({
      customerId,
      id: quoteId,
      notes: data.notes || null,
      preferredEndDate: data.endDate,
      preferredStartDate: data.startDate,
      preferredVisitTime: data.preferredVisitTime,
      propertyId,
      propertySize: data.propertySize ?? null,
      serviceType: data.serviceType,
      status: "requested",
    });

    return { quoteId };
  });
