import { db } from "@fresh-mansions/db";
import { routeStop } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { withQuotePropertyFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const getStopDetail = createServerFn({ method: "GET" })
  .inputValidator(z.object({ stopId: z.string() }))
  .middleware([authMiddleware, requireRoleMiddleware("contractor")])
  .handler(async ({ context, data }) => {
    const { contractorId } = context.session.appUser;
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

    const assignedContractorId =
      stop?.workOrder?.contractorId ?? stop?.route?.contractorId ?? null;

    if (!stop || !contractorId || assignedContractorId !== contractorId) {
      return null;
    }

    return {
      ...stop,
      workOrder: stop.workOrder
        ? withQuotePropertyFullAddress(stop.workOrder)
        : null,
    };
  });
