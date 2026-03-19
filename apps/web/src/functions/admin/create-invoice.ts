import { db } from "@fresh-mansions/db";
import { invoice } from "@fresh-mansions/db/schema/domain";
import { invoiceCreateSchema } from "@fresh-mansions/db/validators";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const createInvoiceRecord = createServerFn({ method: "POST" })
  .inputValidator(invoiceCreateSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const invoiceId = crypto.randomUUID();
    await db.insert(invoice).values({
      amountDue: data.amountDue,
      currency: data.currency,
      customerId: data.customerId,
      dueDate: data.dueDate ?? null,
      id: invoiceId,
      note: data.note ?? null,
      workOrderId: data.workOrderId ?? null,
    });

    return { invoiceId };
  });
