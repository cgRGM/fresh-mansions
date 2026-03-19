import { db } from "@fresh-mansions/db";
import { route } from "@fresh-mansions/db/schema/domain";
import { routeUpsertSchema } from "@fresh-mansions/db/validators";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const createRouteRecord = createServerFn({ method: "POST" })
  .inputValidator(routeUpsertSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const routeId = crypto.randomUUID();
    await db.insert(route).values({
      contractorId: data.contractorId ?? null,
      id: routeId,
      name: data.name,
      routeDate: data.routeDate,
      status: data.status,
    });

    return { routeId };
  });
