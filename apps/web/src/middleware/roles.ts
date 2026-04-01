import { hasRoleAccess } from "@fresh-mansions/db/roles";
import type { UserRole } from "@fresh-mansions/db/validators";
import { createMiddleware } from "@tanstack/react-start";

import type { AppSession } from "@/lib/session";

export const requireRoleMiddleware = (...roles: UserRole[]) =>
  createMiddleware().server(({ context, next }) => {
    const session = context.session as AppSession | null | undefined;

    if (!session || !hasRoleAccess(session.appUser.role, roles)) {
      throw new Error("Forbidden");
    }

    return next({
      context: {
        session,
      },
    });
  });
