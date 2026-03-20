import { db } from "@fresh-mansions/db";
import {
  customer,
  invoice,
  subscription,
} from "@fresh-mansions/db/schema/domain";
import { desc, eq } from "drizzle-orm";

import { createApp, requireSession } from "../lib/hono";
import { requireAuth, requireRole } from "../middleware/auth";

const app = createApp();

app.use("*", requireAuth);
app.use("*", requireRole("customer", "admin"));

app.get("/summary", async (c) => {
  const session = requireSession(c);
  const customerId = c.req.query("customerId");
  const resolvedCustomerId =
    session.appUser.role === "admin" ? customerId : session.appUser.customerId;

  if (!resolvedCustomerId) {
    return c.json({
      invoices: [],
      subscriptions: [],
      summary: {
        openInvoiceCount: 0,
        openInvoiceTotal: 0,
        recurringCount: 0,
      },
    });
  }

  const customerRecord = await db.query.customer.findFirst({
    where: eq(customer.id, resolvedCustomerId),
    with: {
      invoices: {
        orderBy: [desc(invoice.createdAt)],
      },
      subscriptions: {
        orderBy: [desc(subscription.createdAt)],
      },
    },
  });

  const invoices = customerRecord?.invoices ?? [];
  const subscriptions = customerRecord?.subscriptions ?? [];
  const openInvoices = invoices.filter((record) =>
    ["draft", "open"].includes(record.status)
  );

  return c.json({
    invoices,
    subscriptions,
    summary: {
      openInvoiceCount: openInvoices.length,
      openInvoiceTotal: openInvoices.reduce(
        (total, record) => total + record.amountDue - record.amountPaid,
        0
      ),
      recurringCount: subscriptions.filter(
        (record) => record.status === "active"
      ).length,
    },
  });
});

export default app;
