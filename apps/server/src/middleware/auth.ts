import { createMiddleware } from "hono/factory";

import { getAppSession } from "../lib/session";
import type { AppSession } from "../lib/session";

export const requireAuth = createMiddleware(async (c, next) => {
  const session = await getAppSession(c.req.raw.headers);

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("session", session);
  await next();
});

export const requireRole = (...roles: string[]) =>
  createMiddleware(async (c, next) => {
    const session = c.get("session") as AppSession | undefined;

    if (!session || !roles.includes(session.appUser.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  });
