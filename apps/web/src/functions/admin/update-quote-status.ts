import { db } from "@fresh-mansions/db";
import { quote } from "@fresh-mansions/db/schema/domain";
import { quoteStatusEnum } from "@fresh-mansions/db/validators";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const updateQuoteStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      quoteId: z.string(),
      status: quoteStatusEnum,
    })
  )
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(quote)
      .set({
        status: data.status,
      })
      .where(eq(quote.id, data.quoteId))
      .returning();

    return updated;
  });
