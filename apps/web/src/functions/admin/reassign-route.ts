import { db } from "@fresh-mansions/db";
import { route } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const reassignRouteSchema = z.object({
  contractorId: z.string().optional(),
  routeDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid route date"),
  routeId: z.string().min(1),
});

export const reassignRoute = createServerFn({ method: "POST" })
  .inputValidator(reassignRouteSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const [updatedRoute] = await db
      .update(route)
      .set({
        contractorId: data.contractorId ?? null,
        routeDate: data.routeDate,
      })
      .where(eq(route.id, data.routeId))
      .returning({ id: route.id });

    if (!updatedRoute) {
      throw new Error("Route not found");
    }

    return { routeId: updatedRoute.id };
  });
