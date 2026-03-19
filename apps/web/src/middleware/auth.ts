import { createMiddleware } from "@tanstack/react-start";

import { getAppSession } from "@/lib/session";

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const session = await getAppSession(request.headers);
    return next({
      context: { session },
    });
  }
);
