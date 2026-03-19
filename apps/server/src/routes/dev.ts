import { db } from "@fresh-mansions/db";
import { customer, property, quote } from "@fresh-mansions/db/schema/domain";
import { eq } from "drizzle-orm";

import { createApp } from "../lib/hono";
import type { AppSession } from "../lib/session";
import { requireAuth } from "../middleware/auth";

const app = createApp();

app.use("*", requireAuth);

app.post("/seed", async (c) => {
  const session = c.get("session") satisfies AppSession;
  const userId = session.user.id;

  const customerRecord = await db.query.customer.findFirst({
    where: eq(customer.userId, userId),
  });
  let customerId = customerRecord?.id;

  if (!customerId) {
    customerId = crypto.randomUUID();
    await db.insert(customer).values({
      id: customerId,
      phone: "555-123-4567",
      userId,
    });
  }

  const prop1Id = crypto.randomUUID();
  const prop2Id = crypto.randomUUID();

  await db.insert(property).values([
    {
      city: "Harrisonburg",
      customerId,
      id: prop1Id,
      nickname: "Home",
      state: "VA",
      street: "123 Oak Street",
      zip: "22801",
    },
    {
      city: "Harrisonburg",
      customerId,
      id: prop2Id,
      nickname: "Office",
      state: "VA",
      street: "456 Maple Avenue",
      zip: "22802",
    },
  ]);

  await db.insert(quote).values([
    {
      customerId,
      id: crypto.randomUUID(),
      notes: "Front and back yard, bi-weekly preferred.",
      preferredEndDate: "2026-04-15",
      preferredStartDate: "2026-04-01",
      preferredVisitTime: "09:00",
      propertyId: prop1Id,
      propertySize: "medium",
      serviceType: "mowing",
      status: "requested",
    },
    {
      customerId,
      estimateHigh: 15_000,
      estimateLow: 10_000,
      finalizedAt: new Date("2026-03-12T16:15:00.000Z"),
      id: crypto.randomUUID(),
      notes: "Spring cleanup needed",
      preferredEndDate: "2026-04-10",
      preferredStartDate: "2026-04-05",
      preferredVisitTime: "14:30",
      propertyId: prop2Id,
      propertySize: "small",
      scheduledVisitAt: new Date("2026-03-10T16:00:00.000Z"),
      serviceType: "cleanup",
      status: "quote_ready",
    },
  ]);

  return c.json({ message: "Seed data created" }, 201);
});

export default app;
