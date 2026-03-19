import { db } from "@fresh-mansions/db";
import { quote } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const finalizeQuote = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        estimateHigh: z.number().int().positive(),
        estimateLow: z.number().int().positive(),
        quoteId: z.string(),
      })
      .refine((value) => value.estimateHigh >= value.estimateLow, {
        message: "Estimate high must be greater than or equal to estimate low",
        path: ["estimateHigh"],
      })
  )
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(quote)
      .set({
        estimateHigh: data.estimateHigh,
        estimateLow: data.estimateLow,
        finalizedAt: new Date(),
        status: "quote_ready",
      })
      .where(eq(quote.id, data.quoteId))
      .returning();

    return updated;
  });
