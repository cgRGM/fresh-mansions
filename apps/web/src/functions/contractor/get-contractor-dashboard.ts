import { db } from "@fresh-mansions/db";
import { contractor, route, workOrder } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, ne } from "drizzle-orm";

import { withQuotePropertyFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const getContractorDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("contractor")])
  .handler(async ({ context }) => {
    const { contractorId } = context.session.appUser;

    if (!contractorId) {
      return {
        contractor: null,
        recentRoutes: [],
        todayRoute: null,
        todayStops: [],
        workOrderStats: { assigned: 0, completed: 0, inProgress: 0 },
      };
    }

    const today = new Date().toISOString().slice(0, 10);

    const [contractorRecord, todayRouteResult, recentRoutes, allWorkOrders] =
      await Promise.all([
        db.query.contractor.findFirst({
          where: eq(contractor.id, contractorId),
          with: { user: true },
        }),
        db.query.route.findFirst({
          orderBy: [desc(route.routeDate)],
          where: and(
            eq(route.contractorId, contractorId),
            eq(route.routeDate, today)
          ),
          with: {
            stops: {
              orderBy: (table, { asc }) => [asc(table.sequence)],
              with: {
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
        }),
        db.query.route.findMany({
          limit: 5,
          orderBy: [desc(route.routeDate)],
          where: and(
            eq(route.contractorId, contractorId),
            ne(route.routeDate, today)
          ),
          with: {
            stops: {
              orderBy: (table, { asc }) => [asc(table.sequence)],
            },
          },
        }),
        db.query.workOrder.findMany({
          where: eq(workOrder.contractorId, contractorId),
        }),
      ]);

    const assigned = allWorkOrders.filter(
      (wo) => wo.status === "assigned" || wo.status === "pending"
    ).length;
    const inProgress = allWorkOrders.filter(
      (wo) => wo.status === "in_progress"
    ).length;
    const completed = allWorkOrders.filter(
      (wo) => wo.status === "completed"
    ).length;

    return {
      contractor: contractorRecord,
      recentRoutes,
      todayRoute: todayRouteResult ?? null,
      todayStops:
        todayRouteResult?.stops.map((stop) => ({
          ...stop,
          workOrder: stop.workOrder
            ? withQuotePropertyFullAddress(stop.workOrder)
            : null,
        })) ?? [],
      workOrderStats: { assigned, completed, inProgress },
    };
  });
