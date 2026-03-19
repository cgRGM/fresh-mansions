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
    const stop = await db.query.routeStop.findFirst({
      where: eq(routeStop.id, data.stopId),
      with: {
        workOrder: true,
      },
    });

    if (
      !stop ||
      stop.workOrder?.contractorId !== context.session.appUser.contractorId
    ) {
      throw new Error("Stop not found");
    }

    await db
      .update(routeStop)
      .set({
        notes: data.note ?? stop.notes,
        status: "completed",
      })
      .where(eq(routeStop.id, data.stopId));

    await db
      .update(workOrder)
      .set({
        completedAt: new Date(),
        status: "completed",
      })
      .where(
        and(
          eq(workOrder.id, stop.workOrderId),
          eq(workOrder.contractorId, context.session.appUser.contractorId)
        )
      );

    return { ok: true };
  });
