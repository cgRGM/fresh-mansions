import { db } from "@fresh-mansions/db";
import {
  contractor,
  route,
  routeStop,
  workOrder,
} from "@fresh-mansions/db/schema/domain";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createApp, requireSession } from "../lib/hono";
import { requireAuth, requireRole } from "../middleware/auth";

const app = createApp();

const completeStopSchema = z.object({
  note: z.string().optional(),
});

app.use("*", requireAuth);
app.use("*", requireRole("contractor"));

app.get("/me/route", async (c) => {
  const session = requireSession(c);

  if (!session.appUser.contractorId) {
    return c.json({ route: null, stops: [] });
  }

  const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
  const contractorRecord = await db.query.contractor.findFirst({
    where: eq(contractor.id, session.appUser.contractorId),
    with: {
      routes: {
        orderBy: (table, { desc: routeDesc }) => [routeDesc(table.routeDate)],
        where: (table, { eq: routeEq }) => routeEq(table.routeDate, date),
        with: {
          stops: {
            orderBy: (table, { asc }) => [asc(table.sequence)],
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

  const todayRoute = contractorRecord?.routes[0] ?? null;

  return c.json({
    route: todayRoute,
    stops: todayRoute?.stops ?? [],
  });
});

app.get("/stops/:id", async (c) => {
  const session = requireSession(c);

  if (!session.appUser.contractorId) {
    return c.json({ error: "Stop not found" }, 404);
  }

  const stopId = c.req.param("id");

  const stop = await db.query.routeStop.findFirst({
    where: eq(routeStop.id, stopId),
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

  if (!stop || assignedContractorId !== session.appUser.contractorId) {
    return c.json({ error: "Stop not found" }, 404);
  }

  return c.json({ stop });
});

app.post("/stops/:id/complete", async (c) => {
  const session = requireSession(c);

  if (!session.appUser.contractorId) {
    return c.json({ error: "Stop not found" }, 404);
  }

  const stopId = c.req.param("id");
  const body = completeStopSchema.parse(await c.req.json());
  const stop = await db.query.routeStop.findFirst({
    where: eq(routeStop.id, stopId),
    with: {
      route: true,
      workOrder: true,
    },
  });

  const assignedContractorId =
    stop?.workOrder?.contractorId ?? stop?.route?.contractorId ?? null;

  if (!stop || assignedContractorId !== session.appUser.contractorId) {
    return c.json({ error: "Stop not found" }, 404);
  }

  await db
    .update(routeStop)
    .set({ notes: body.note ?? stop.notes, status: "completed" })
    .where(eq(routeStop.id, stopId));

  if (stop.workOrderId) {
    await db
      .update(workOrder)
      .set({
        completedAt: new Date(),
        status: "completed",
      })
      .where(
        and(
          eq(workOrder.id, stop.workOrderId),
          eq(workOrder.contractorId, session.appUser.contractorId)
        )
      );
  }

  return c.json({ ok: true });
});

app.get("/me/routes", async (c) => {
  const session = requireSession(c);

  if (!session.appUser.contractorId) {
    return c.json({ routes: [] });
  }

  const routes = await db.query.route.findMany({
    orderBy: [desc(route.routeDate)],
    where: eq(route.contractorId, session.appUser.contractorId),
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
  });

  return c.json({ routes });
});

app.get("/me/work-orders", async (c) => {
  const session = requireSession(c);

  if (!session.appUser.contractorId) {
    return c.json({ workOrders: [] });
  }

  const workOrders = await db.query.workOrder.findMany({
    orderBy: [desc(workOrder.createdAt)],
    where: eq(workOrder.contractorId, session.appUser.contractorId),
    with: {
      quote: {
        with: {
          customer: { with: { user: true } },
          property: true,
        },
      },
    },
  });

  return c.json({ workOrders });
});

app.get("/me/profile", async (c) => {
  const session = requireSession(c);

  if (!session.appUser.contractorId) {
    return c.json({ contractor: null });
  }

  const contractorRecord = await db.query.contractor.findFirst({
    where: eq(contractor.id, session.appUser.contractorId),
    with: {
      user: true,
    },
  });

  return c.json({ contractor: contractorRecord });
});

export default app;
