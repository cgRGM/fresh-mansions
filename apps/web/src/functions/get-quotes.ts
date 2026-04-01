import { db } from "@fresh-mansions/db";
import { customer } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { withPropertyFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";

export const getQuotes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { customerId } = context.session.appUser;

    if (!customerId) {
      return {
        quotes: [],
      };
    }

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.id, customerId),
      with: {
        quotes: {
          orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
          with: {
            photos: true,
            property: true,
          },
        },
      },
    });

    return {
      quotes: (customerRecord?.quotes ?? []).map((record) =>
        withPropertyFullAddress(record)
      ),
    };
  });
