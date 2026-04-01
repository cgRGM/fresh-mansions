import { db } from "@fresh-mansions/db";
import { customer } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { withPropertiesFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";

export const getProperties = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { customerId } = context.session.appUser;

    if (!customerId) {
      return {
        properties: [],
      };
    }

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.id, customerId),
      with: {
        properties: {
          with: {
            quotes: true,
          },
        },
      },
    });

    return {
      properties: withPropertiesFullAddress(customerRecord?.properties ?? []),
    };
  });
