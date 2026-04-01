import { db } from "@fresh-mansions/db";
import { quote, workOrder } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";

export const respondToQuote = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      quoteId: z.string(),
      status: z.enum(["accepted", "rejected"]),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { customerId } = context.session.appUser;

    if (!customerId) {
      throw new Error("Customer account not found");
    }

    const quoteRecord = await db.query.quote.findFirst({
      where: eq(quote.id, data.quoteId),
    });

    if (!quoteRecord || quoteRecord.customerId !== customerId) {
      throw new Error("Quote not found");
    }

    if (data.status === "accepted") {
      const existingWorkOrder = await db.query.workOrder.findFirst({
        where: eq(workOrder.quoteId, data.quoteId),
      });

      if (!existingWorkOrder) {
        await db.insert(workOrder).values({
          id: crypto.randomUUID(),
          notes: quoteRecord.notes,
          quoteId: data.quoteId,
          scheduledDate:
            quoteRecord.proposedWorkDate ?? quoteRecord.preferredStartDate,
          status: "pending",
        });
      }
    }

    const [updated] = await db
      .update(quote)
      .set({
        status: data.status,
      })
      .where(eq(quote.id, data.quoteId))
      .returning();

    return updated;
  });
