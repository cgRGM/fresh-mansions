import { db } from "@fresh-mansions/db";
import { quote } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const getAdminQuoteDetail = createServerFn({ method: "GET" })
  .inputValidator(z.object({ quoteId: z.string() }))
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const result = await db.query.quote.findFirst({
      where: eq(quote.id, data.quoteId),
      with: {
        customer: {
          with: {
            user: true,
          },
        },
        photos: true,
        property: true,
        workOrders: true,
      },
    });

    return result ?? null;
  });
