import { db } from "@fresh-mansions/db";
import { route } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { withQuotePropertyFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const getContractorRoutes = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("contractor")])
  .handler(async ({ context }) => {
    const { contractorId } = context.session.appUser;

    if (!contractorId) {
      return { routes: [] };
    }

    const routes = await db.query.route.findMany({
      orderBy: [desc(route.routeDate)],
      where: eq(route.contractorId, contractorId),
      with: {
        stops: {
          orderBy: (table, { asc }) => [asc(table.sequence)],
          with: {
            property: {
              with: {
                customer: { with: { user: true } },
              },
            },
            workOrder: {
              with: {
                quote: {
                  with: {
                    customer: { with: { user: true } },
                    property: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      routes: routes.map((r) => ({
        ...r,
        stops: r.stops.map((stop) => ({
          ...stop,
          workOrder: stop.workOrder
            ? withQuotePropertyFullAddress(stop.workOrder)
            : null,
        })),
      })),
    };
  });
