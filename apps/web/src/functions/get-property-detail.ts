import { db } from "@fresh-mansions/db";
import { customer, property } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";

export const getPropertyDetail = createServerFn({ method: "GET" })
  .inputValidator(z.object({ propertyId: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { customerId } = context.session.appUser;

    if (!customerId) {
      return null;
    }

    const propertyRecord = await db.query.property.findFirst({
      where: eq(property.id, data.propertyId),
      with: {
        quotes: {
          orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
          with: {
            photos: true,
          },
        },
      },
    });

    if (!propertyRecord || propertyRecord.customerId !== customerId) {
      return null;
    }

    return propertyRecord;
  });
