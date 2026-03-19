import { db } from "@fresh-mansions/db";
import { customer, property } from "@fresh-mansions/db/schema/domain";
import { eq } from "drizzle-orm";

import { createApp } from "../lib/hono";
import type { AppSession } from "../lib/session";
import { requireAuth } from "../middleware/auth";

const app = createApp();

app.use("*", requireAuth);

app.get("/", async (c) => {
  const session = c.get("session") satisfies AppSession;
  const userId = session.user.id;

  const customerRecord = await db.query.customer.findFirst({
    where: eq(customer.userId, userId),
    with: {
      properties: true,
    },
  });

  return c.json({ properties: customerRecord?.properties ?? [] });
});

app.get("/:id", async (c) => {
  const session = c.get("session") satisfies AppSession;
  const userId = session.user.id;
  const propertyId = c.req.param("id");

  const customerRecord = await db.query.customer.findFirst({
    where: eq(customer.userId, userId),
  });

  if (!customerRecord) {
    return c.json({ error: "Not found" }, 404);
  }

  const propertyRecord = await db.query.property.findFirst({
    where: eq(property.id, propertyId),
    with: {
      quotes: true,
    },
  });

  if (!propertyRecord || propertyRecord.customerId !== customerRecord.id) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ property: propertyRecord });
});

export default app;
