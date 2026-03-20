import type { Context } from "hono";
import { Hono } from "hono";

import type { AppSession } from "./session";

export interface AppHonoContext {
  Variables: {
    session: AppSession | null;
  };
}

export const createApp = () => new Hono<AppHonoContext>();

export const requireSession = (c: Context<AppHonoContext>): AppSession => {
  const session = c.get("session");

  if (!session) {
    throw new Error("Authenticated route is missing session context");
  }

  return session;
};
