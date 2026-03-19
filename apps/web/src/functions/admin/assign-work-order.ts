import { db } from "@fresh-mansions/db";
import { route, routeStop, workOrder } from "@fresh-mansions/db/schema/domain";
import { workOrderAssignmentSchema } from "@fresh-mansions/db/validators";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const assignWorkOrder = createServerFn({ method: "POST" })
  .inputValidator(workOrderAssignmentSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const [updatedWorkOrder] = await db
      .update(workOrder)
      .set({
        contractorId: data.contractorId,
        scheduledDate: data.scheduledDate ?? undefined,
        status: "assigned",
      })
      .where(eq(workOrder.id, data.workOrderId))
      .returning();

    if (!updatedWorkOrder) {
      throw new Error("Work order not found");
    }

    if (data.routeId) {
      const existingStop = await db.query.routeStop.findFirst({
        where: eq(routeStop.workOrderId, data.workOrderId),
      });

      if (!existingStop) {
        const routeRecord = await db.query.route.findFirst({
          where: eq(route.id, data.routeId),
          with: {
            stops: true,
          },
        });

        if (!routeRecord) {
          throw new Error("Route not found");
        }

        await db.insert(routeStop).values({
          id: crypto.randomUUID(),
          routeId: routeRecord.id,
          sequence: routeRecord.stops.length,
          workOrderId: data.workOrderId,
        });
      }
    }

    return updatedWorkOrder;
  });
