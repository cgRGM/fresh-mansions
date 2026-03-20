import { auth } from "@fresh-mansions/auth";
import { env } from "@fresh-mansions/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import type { AppHonoContext } from "./lib/hono";
import { getAppSession } from "./lib/session";
import adminRoutes from "./routes/admin";
import billingRoutes from "./routes/billing";
import contractorRoutes from "./routes/contractor";
import devRoutes from "./routes/dev";
import integrationsRoutes from "./routes/integrations";
import propertiesRoutes from "./routes/properties";
import quotesRoutes from "./routes/quotes";

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

export const app = new Hono<AppHonoContext>();

app.use(logger());
app.use("*", async (c, next) => {
  const session = await getAppSession(c.req.raw.headers);
  c.set("session", session);
  await next();
});
app.use(
  "/*",
  cors({
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    origin: (origin) => {
      if (!origin) {
        return env.CORS_ORIGIN;
      }

      if (origin === env.CORS_ORIGIN || LOCAL_ORIGIN_PATTERN.test(origin)) {
        return origin;
      }

      return null;
    },
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/api/quotes", quotesRoutes);
app.route("/api/properties", propertiesRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/billing", billingRoutes);
app.route("/api/contractor", contractorRoutes);
app.route("/api/dev", devRoutes);
app.route("/api/integrations", integrationsRoutes);
app.get("/", (c) => c.text("OK"));

export type AppType = typeof app;
