import { db } from "@fresh-mansions/db";
import { routeStop } from "@fresh-mansions/db/schema/domain";
import { routeStopUpsertSchema } from "@fresh-mansions/db/validators";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const addRouteStop = createServerFn({ method: "POST" })
  .inputValidator(routeStopUpsertSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const stopId = crypto.randomUUID();
    await db.insert(routeStop).values({
      id: stopId,
      notes: data.notes ?? null,
      routeId: data.routeId,
      sequence: data.sequence,
      status: data.status,
      workOrderId: data.workOrderId,
    });

    return { stopId };
  });
