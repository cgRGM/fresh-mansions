import { db } from "@fresh-mansions/db";
import { createServerFn } from "@tanstack/react-start";

import { withPropertyFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const listQuotes = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () => {
    const quoteRecords = await db.query.quote.findMany({
      orderBy: (quoteTable, { desc }) => [desc(quoteTable.createdAt)],
      with: {
        customer: {
          with: {
            user: true,
          },
        },
        photos: true,
        property: true,
      },
    });

    return quoteRecords.map((record) => withPropertyFullAddress(record));
  });
