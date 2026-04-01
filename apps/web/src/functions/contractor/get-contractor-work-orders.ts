import { db } from "@fresh-mansions/db";
import { workOrder } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { withQuotePropertyFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const getContractorWorkOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("contractor")])
  .handler(async ({ context }) => {
    const { contractorId } = context.session.appUser;

    if (!contractorId) {
      return { workOrders: [] };
    }

    const workOrders = await db.query.workOrder.findMany({
      orderBy: [desc(workOrder.createdAt)],
      where: eq(workOrder.contractorId, contractorId),
      with: {
        quote: {
          with: {
            customer: { with: { user: true } },
            property: true,
          },
        },
      },
    });

    return {
      workOrders: workOrders.map((wo) => withQuotePropertyFullAddress(wo)),
    };
  });
