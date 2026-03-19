import { Hono } from "hono";

import type { AppSession } from "./session";

export interface AppHonoContext {
  Variables: {
    session: AppSession;
  };
}

export const createApp = () => new Hono<AppHonoContext>();
