import { db } from "@fresh-mansions/db";
import { quote, workOrder } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const convertToWorkOrder = createServerFn({ method: "POST" })
  .inputValidator(z.object({ quoteId: z.string() }))
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const quoteRecord = await db.query.quote.findFirst({
      where: eq(quote.id, data.quoteId),
    });

    if (!quoteRecord) {
      throw new Error("Quote not found");
    }

    const workOrderId = crypto.randomUUID();
    await db.insert(workOrder).values({
      id: workOrderId,
      notes: quoteRecord.notes,
      quoteId: data.quoteId,
      scheduledDate: quoteRecord.preferredStartDate,
      status: "pending",
    });

    await db
      .update(quote)
      .set({ status: "converted" })
      .where(eq(quote.id, data.quoteId));

    return { workOrderId };
  });
