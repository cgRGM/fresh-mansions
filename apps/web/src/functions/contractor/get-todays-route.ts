import { db } from "@fresh-mansions/db";
import { contractor } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { withQuotePropertyFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const getTodaysRoute = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("contractor")])
  .handler(async ({ context }) => {
    const { contractorId } = context.session.appUser;

    if (!contractorId) {
      return {
        route: null,
        stops: [],
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const contractorRecord = await db.query.contractor.findFirst({
      where: eq(contractor.id, contractorId),
      with: {
        routes: {
          orderBy: (table, { desc }) => [desc(table.routeDate)],
          where: (table, { eq: routeEq }) => routeEq(table.routeDate, today),
          with: {
            stops: {
              orderBy: (stops, { asc }) => [asc(stops.sequence)],
              with: {
                workOrder: {
                  with: {
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
        },
      },
    });

    const routeRecord = contractorRecord?.routes[0] ?? null;

    return {
      route: routeRecord
        ? {
            ...routeRecord,
            stops: routeRecord.stops.map((stop) => ({
              ...stop,
              workOrder: withQuotePropertyFullAddress(stop.workOrder),
            })),
          }
        : null,
      stops:
        routeRecord?.stops.map((stop) => ({
          ...stop,
          workOrder: withQuotePropertyFullAddress(stop.workOrder),
        })) ?? [],
    };
  });
