import { db } from "@fresh-mansions/db";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const listRoutes = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () =>
    db.query.route.findMany({
      orderBy: (table, { desc }) => [desc(table.routeDate)],
      with: {
        contractor: true,
        stops: {
          orderBy: (stops, { asc }) => [asc(stops.sequence)],
          with: {
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
    })
  );
