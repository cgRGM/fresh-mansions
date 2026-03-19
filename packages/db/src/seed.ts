import type { DrizzleD1Database } from "drizzle-orm/d1";

import {
  contractor,
  customer,
  property,
  quote,
  workOrder,
} from "./schema/domain";

export const seed = async (db: DrizzleD1Database<Record<string, unknown>>) => {
  const now = Date.now();

  // Create customers (requires existing users — use placeholder userIds)
  const customer1Id = crypto.randomUUID();
  const customer2Id = crypto.randomUUID();

  await db.insert(customer).values([
    {
      id: customer1Id,
      phone: "540-555-0101",
      userId: "seed-user-1",
    },
    {
      id: customer2Id,
      phone: "540-555-0202",
      userId: "seed-user-2",
    },
  ]);

  // Create properties
  const prop1Id = crypto.randomUUID();
  const prop2Id = crypto.randomUUID();
  const prop3Id = crypto.randomUUID();

  await db.insert(property).values([
    {
      city: "Harrisonburg",
      customerId: customer1Id,
      id: prop1Id,
      nickname: "Home",
      state: "VA",
      street: "123 Main St",
      zip: "22801",
    },
    {
      city: "Harrisonburg",
      customerId: customer1Id,
      id: prop2Id,
      nickname: "Office",
      state: "VA",
      street: "456 Liberty St",
      zip: "22802",
    },
    {
      city: "Staunton",
      customerId: customer2Id,
      id: prop3Id,
      nickname: "Primary Residence",
      state: "VA",
      street: "789 Augusta Ave",
      zip: "24401",
    },
  ]);

  // Create quotes
  const quote1Id = crypto.randomUUID();
  const quote2Id = crypto.randomUUID();
  const quote3Id = crypto.randomUUID();
  const quote4Id = crypto.randomUUID();

  await db.insert(quote).values([
    {
      customerId: customer1Id,
      id: quote1Id,
      notes: "Need someone to assess the front slope and irrigation coverage.",
      preferredEndDate: "2026-04-15",
      preferredStartDate: "2026-04-01",
      preferredVisitTime: "09:30",
      propertyId: prop1Id,
      propertySize: "medium",
      serviceType: "mowing",
      status: "requested",
    },
    {
      customerId: customer1Id,
      id: quote2Id,
      notes: "Looking for a complete backyard redesign with a new border bed.",
      preferredEndDate: "2026-05-30",
      preferredStartDate: "2026-05-01",
      preferredVisitTime: "14:00",
      propertyId: prop2Id,
      propertySize: "large",
      scheduledVisitAt: new Date("2026-04-22T14:00:00.000Z"),
      serviceType: "landscaping",
      status: "visit_scheduled",
    },
    {
      customerId: customer2Id,
      estimateHigh: 15_000,
      estimateLow: 10_000,
      finalizedAt: new Date("2026-03-12T16:15:00.000Z"),
      id: quote3Id,
      preferredEndDate: "2026-04-10",
      preferredStartDate: "2026-04-05",
      preferredVisitTime: "11:00",
      propertyId: prop3Id,
      propertySize: "small",
      scheduledVisitAt: new Date("2026-03-10T16:00:00.000Z"),
      serviceType: "cleanup",
      status: "quote_ready",
    },
    {
      customerId: customer2Id,
      estimateHigh: 13_000,
      estimateLow: 8000,
      finalizedAt: new Date("2026-03-08T15:00:00.000Z"),
      id: quote4Id,
      preferredEndDate: "2026-04-20",
      preferredStartDate: "2026-04-15",
      preferredVisitTime: "17:30",
      propertyId: prop3Id,
      propertySize: "medium",
      scheduledVisitAt: new Date("2026-03-07T17:30:00.000Z"),
      serviceType: "fertilization",
      status: "converted",
    },
  ]);

  // Create contractor
  const contractor1Id = crypto.randomUUID();
  await db.insert(contractor).values({
    displayName: "Mike Johnson",
    id: contractor1Id,
    status: "active",
    userId: "seed-contractor-1",
  });

  // Create work order
  await db.insert(workOrder).values({
    contractorId: contractor1Id,
    id: crypto.randomUUID(),
    notes: "Spring fertilization treatment",
    quoteId: quote4Id,
    scheduledDate: "2026-04-15",
    status: "assigned",
  });

  return { message: `Seeded at ${new Date(now).toISOString()}` };
};
