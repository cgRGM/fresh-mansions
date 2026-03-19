import { db } from "@fresh-mansions/db";
import { customer, workOrder } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";

import { authMiddleware } from "@/middleware/auth";

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { customerId } = context.session.appUser;

    if (!customerId) {
      return {
        properties: [],
        quotes: [],
      };
    }

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.id, customerId),
      with: {
        invoices: {
          orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
        },
        properties: {
          orderBy: (properties, { desc }) => [desc(properties.createdAt)],
        },
        quotes: {
          limit: 10,
          orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
          with: {
            photos: true,
            property: true,
          },
        },
        subscriptions: {
          orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
        },
      },
    });

    const quotes = customerRecord?.quotes ?? [];
    const quoteIds = quotes.map((record) => record.id);
    const properties = customerRecord?.properties ?? [];
    const invoices = customerRecord?.invoices ?? [];
    const subscriptions = customerRecord?.subscriptions ?? [];
    const orders =
      quoteIds.length > 0
        ? await db.query.workOrder.findMany({
            orderBy: (ordersTable, { desc }) => [desc(ordersTable.createdAt)],
            where: inArray(workOrder.quoteId, quoteIds),
            with: {
              contractor: true,
              invoice: true,
              quote: {
                with: {
                  property: true,
                },
              },
            },
          })
        : [];

    return {
      invoices,
      orders,
      properties,
      quotes,
      subscriptions,
    };
  });
