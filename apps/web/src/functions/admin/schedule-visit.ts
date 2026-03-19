import { db } from "@fresh-mansions/db";
import { quote } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const scheduleVisit = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      quoteId: z.string(),
      scheduledVisitAt: z.string(),
    })
  )
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(quote)
      .set({
        scheduledVisitAt: new Date(data.scheduledVisitAt),
        status: "visit_scheduled",
      })
      .where(eq(quote.id, data.quoteId))
      .returning();

    return updated;
  });
