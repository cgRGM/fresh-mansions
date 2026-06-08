import { db } from "@fresh-mansions/db";
import { route } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const attachMyRouteOnlineJobTokenSchema = z.object({
  jobToken: z.string().trim().min(1, "MRO job token is required"),
  routeId: z.string().min(1, "Route is required"),
});

export const attachMyRouteOnlineJobToken = createServerFn({ method: "POST" })
  .inputValidator(attachMyRouteOnlineJobTokenSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const routeRecord = await db.query.route.findFirst({
      where: eq(route.id, data.routeId),
    });

    if (!routeRecord) {
      throw new Error("Route not found");
    }

    await db
      .update(route)
      .set({
        mroAppNavigationUrl: null,
        mroError: null,
        mroJobToken: data.jobToken.trim(),
        mroLastCheckedAt: null,
        mroPrintAndDirectionsUrl: null,
        mroResponse: null,
        mroStatus: "processing",
        mroSubmittedAt: new Date(),
        mroSyncedAt: null,
        status: "draft",
      })
      .where(eq(route.id, data.routeId));

    return {
      jobToken: data.jobToken.trim(),
      routeId: data.routeId,
    };
  });
