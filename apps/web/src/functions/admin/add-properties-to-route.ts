import { db } from "@fresh-mansions/db";
import { route, routeStop } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const addPropertiesToRouteSchema = z.object({
  propertyIds: z.array(z.string()).min(1, "Select at least one property"),
  routeId: z.string().min(1, "Choose a route"),
});

export const addPropertiesToRoute = createServerFn({ method: "POST" })
  .inputValidator(addPropertiesToRouteSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const routeRecord = await db.query.route.findFirst({
      where: eq(route.id, data.routeId),
    });

    if (!routeRecord) {
      throw new Error("Route not found");
    }

    const existingStops = await db.query.routeStop.findMany({
      where: eq(routeStop.routeId, data.routeId),
    });

    const existingPropertyIds = new Set<string>();

    for (const stop of existingStops) {
      if (stop.propertyId) {
        existingPropertyIds.add(stop.propertyId);
      }
    }

    const dedupedPropertyIds = [...new Set(data.propertyIds)];
    const stopsToInsert: {
      id: string;
      propertyId: string;
      routeId: string;
      sequence: number;
      status: "pending";
    }[] = [];

    let nextSequence = existingStops.length;

    for (const propertyId of dedupedPropertyIds) {
      if (existingPropertyIds.has(propertyId)) {
        continue;
      }

      stopsToInsert.push({
        id: crypto.randomUUID(),
        propertyId,
        routeId: data.routeId,
        sequence: nextSequence,
        status: "pending",
      });

      nextSequence += 1;
    }

    if (stopsToInsert.length === 0) {
      return { added: 0 };
    }

    await db.insert(routeStop).values(stopsToInsert);

    return { added: stopsToInsert.length };
  });
