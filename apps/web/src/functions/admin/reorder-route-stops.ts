import { db } from "@fresh-mansions/db";
import { routeStop } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const reorderRouteStopsSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
  stopIds: z.array(z.string()).min(1, "At least one stop is required"),
});

export const reorderRouteStops = createServerFn({ method: "POST" })
  .inputValidator(reorderRouteStopsSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const routeStops = await db.query.routeStop.findMany({
      where: eq(routeStop.routeId, data.routeId),
    });

    if (routeStops.length === 0) {
      throw new Error("Route has no stops to reorder");
    }

    if (routeStops.length !== data.stopIds.length) {
      throw new Error("Stop list is out of date. Refresh and try again.");
    }

    const routeStopIdSet = new Set(routeStops.map((stop) => stop.id));

    if (routeStopIdSet.size !== data.stopIds.length) {
      throw new Error("Stop list contains duplicates");
    }

    for (const stopId of data.stopIds) {
      if (!routeStopIdSet.has(stopId)) {
        throw new Error("Stop list is invalid for this route");
      }
    }

    for (const [sequence, stopId] of data.stopIds.entries()) {
      await db
        .update(routeStop)
        .set({ sequence })
        .where(eq(routeStop.id, stopId));
    }

    return { ok: true };
  });
