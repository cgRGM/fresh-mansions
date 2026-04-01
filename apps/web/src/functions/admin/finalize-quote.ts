import { db } from "@fresh-mansions/db";
import { quote } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const sendQuote = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      finalPrice: z.number().int().positive(),
      proposedWorkDate: z.string().min(1),
      quoteId: z.string(),
    })
  )
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const quoteRecord = await db.query.quote.findFirst({
      where: eq(quote.id, data.quoteId),
    });

    if (!quoteRecord) {
      throw new Error("Quote not found");
    }

    if (!quoteRecord.scheduledVisitAt) {
      throw new Error("Schedule the site visit before sending the quote");
    }

    const [updated] = await db
      .update(quote)
      .set({
        finalPrice: data.finalPrice,
        proposedWorkDate: data.proposedWorkDate,
        quotedAt: new Date(),
        status: "quote_sent",
      })
      .where(eq(quote.id, data.quoteId))
      .returning();

    return updated;
  });
