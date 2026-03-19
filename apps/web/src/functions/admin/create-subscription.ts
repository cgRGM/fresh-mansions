import { db } from "@fresh-mansions/db";
import { subscription } from "@fresh-mansions/db/schema/domain";
import { subscriptionCreateSchema } from "@fresh-mansions/db/validators";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const createSubscriptionRecord = createServerFn({ method: "POST" })
  .inputValidator(subscriptionCreateSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const subscriptionId = crypto.randomUUID();
    await db.insert(subscription).values({
      currency: data.currency,
      customerId: data.customerId,
      id: subscriptionId,
      interval: data.interval,
      intervalCount: data.intervalCount,
      nickname: data.nickname ?? null,
      priceCents: data.priceCents,
    });

    return { subscriptionId };
  });
