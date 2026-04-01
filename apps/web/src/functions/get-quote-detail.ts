import { db } from "@fresh-mansions/db";
import { quote } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { withPropertyFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";

export const getQuoteDetail = createServerFn({ method: "GET" })
  .inputValidator(z.object({ quoteId: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { customerId } = context.session.appUser;

    if (!customerId) {
      return null;
    }

    const quoteRecord = await db.query.quote.findFirst({
      where: eq(quote.id, data.quoteId),
      with: {
        photos: true,
        property: true,
      },
    });

    if (!quoteRecord || quoteRecord.customerId !== customerId) {
      return null;
    }

    return withPropertyFullAddress(quoteRecord);
  });
