import { db } from "@fresh-mansions/db";
import {
  contractor,
  routeStop,
  workOrder,
} from "@fresh-mansions/db/schema/domain";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../lib/hono";
import type { AppSession } from "../lib/session";
import { requireAuth, requireRole } from "../middleware/auth";

const app = createApp();

const completeStopSchema = z.object({
  note: z.string().optional(),
});

app.use("*", requireAuth);
app.use("*", requireRole("contractor"));

app.get("/me/route", async (c) => {
  const session = c.get("session") satisfies AppSession;

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
  const session = c.get("session") satisfies AppSession;

  if (!session.appUser.contractorId) {
    return c.json({ error: "Stop not found" }, 404);
  }

  const stopId = c.req.param("id");

  const stop = await db.query.routeStop.findFirst({
    where: eq(routeStop.id, stopId),
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

  if (!stop || stop.workOrder?.contractorId !== session.appUser.contractorId) {
    return c.json({ error: "Stop not found" }, 404);
  }

  return c.json({ stop });
});

app.post("/stops/:id/complete", async (c) => {
  const session = c.get("session") satisfies AppSession;

  if (!session.appUser.contractorId) {
    return c.json({ error: "Stop not found" }, 404);
  }

  const stopId = c.req.param("id");
  const body = completeStopSchema.parse(await c.req.json());
  const stop = await db.query.routeStop.findFirst({
    where: eq(routeStop.id, stopId),
    with: {
      workOrder: true,
    },
  });

  if (!stop || stop.workOrder?.contractorId !== session.appUser.contractorId) {
    return c.json({ error: "Stop not found" }, 404);
  }

  await db
    .update(routeStop)
    .set({ notes: body.note ?? stop.notes, status: "completed" })
    .where(eq(routeStop.id, stopId));

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

  return c.json({ ok: true });
});

export default app;
