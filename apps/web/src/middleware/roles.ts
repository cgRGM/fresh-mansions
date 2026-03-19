import { createMiddleware } from "@tanstack/react-start";

import type { AppSession } from "@/lib/session";

export const requireRoleMiddleware = (...roles: string[]) =>
  createMiddleware().server(async ({ context, next }) => {
    const session = context.session as AppSession | null | undefined;

    if (!session || !roles.includes(session.appUser.role)) {
      throw new Error("Forbidden");
    }

    return next({
      context: {
        session,
      },
    });
  });
