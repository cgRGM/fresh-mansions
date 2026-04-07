import { db } from "@fresh-mansions/db";
import { routeStop, workOrder } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const completeStop = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      note: z.string().optional(),
      stopId: z.string(),
    })
  )
  .middleware([authMiddleware, requireRoleMiddleware("contractor")])
  .handler(async ({ context, data }) => {
    const { contractorId } = context.session.appUser;
    const stop = await db.query.routeStop.findFirst({
      where: eq(routeStop.id, data.stopId),
      with: {
        route: true,
        workOrder: true,
      },
    });

    const assignedContractorId =
      stop?.workOrder?.contractorId ?? stop?.route?.contractorId ?? null;

    if (!stop || !contractorId || assignedContractorId !== contractorId) {
      throw new Error("Stop not found");
    }

    await db
      .update(routeStop)
      .set({
        notes: data.note ?? stop.notes,
        status: "completed",
      })
      .where(eq(routeStop.id, data.stopId));

    if (stop.workOrderId) {
      await db
        .update(workOrder)
        .set({
          completedAt: new Date(),
          status: "completed",
        })
        .where(
          and(
            eq(workOrder.id, stop.workOrderId),
            eq(workOrder.contractorId, contractorId)
          )
        );
    }

    return { ok: true };
  });
