import { db } from "@fresh-mansions/db";
import { routeStop } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const addPropertyToRouteSchema = z.object({
  notes: z.string().optional(),
  propertyId: z.string(),
  routeId: z.string(),
});

export const addPropertyToRoute = createServerFn({ method: "POST" })
  .inputValidator(addPropertyToRouteSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const existingStops = await db.query.routeStop.findMany({
      where: eq(routeStop.routeId, data.routeId),
    });

    const nextSequence = existingStops.length;

    await db.insert(routeStop).values({
      id: crypto.randomUUID(),
      notes: data.notes,
      propertyId: data.propertyId,
      routeId: data.routeId,
      sequence: nextSequence,
      status: "pending",
    });

    return { ok: true };
  });
