import { db } from "@fresh-mansions/db";
import { routeStop } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const getStopDetail = createServerFn({ method: "GET" })
  .inputValidator(z.object({ stopId: z.string() }))
  .middleware([authMiddleware, requireRoleMiddleware("contractor")])
  .handler(async ({ context, data }) => {
    const stop = await db.query.routeStop.findFirst({
      where: eq(routeStop.id, data.stopId),
      with: {
        route: true,
        workOrder: {
          with: {
            contractor: true,
            quote: {
              with: {
                customer: {
                  with: {
                    user: true,
                  },
                },
                photos: true,
                property: true,
              },
            },
          },
        },
      },
    });

    if (
      !stop ||
      stop.workOrder?.contractorId !== context.session.appUser.contractorId
    ) {
      return null;
    }

    return stop;
  });
