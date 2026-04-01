import { hasRoleAccess } from "@fresh-mansions/db/roles";
import type { UserRole } from "@fresh-mansions/db/validators";
import { createMiddleware } from "hono/factory";

import { getAppSession } from "../lib/session";
import type { AppSession } from "../lib/session";

export const requireAuth = createMiddleware(async (c, next) => {
  const session = c.get("session") ?? (await getAppSession(c.req.raw.headers));

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("session", session);
  await next();
});

export const requireRole = (...roles: UserRole[]) =>
  createMiddleware(async (c, next) => {
    const session = c.get("session") as AppSession | undefined;

    if (!session || !hasRoleAccess(session.appUser.role, roles)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  });
