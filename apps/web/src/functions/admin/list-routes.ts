import { db } from "@fresh-mansions/db";
import { createServerFn } from "@tanstack/react-start";

import { withQuotePropertyFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const listRoutes = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () => {
    const routeRecords = await db.query.route.findMany({
      orderBy: (table, { desc }) => [desc(table.routeDate)],
      with: {
        contractor: true,
        stops: {
          orderBy: (stops, { asc }) => [asc(stops.sequence)],
          with: {
            property: {
              with: {
                customer: {
                  with: {
                    user: true,
                  },
                },
              },
            },
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
                    property: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return routeRecords.map((routeRecord) => ({
      ...routeRecord,
      stops: routeRecord.stops.map((stop) => ({
        ...stop,
        workOrder: stop.workOrder
          ? withQuotePropertyFullAddress(stop.workOrder)
          : null,
      })),
    }));
  });
