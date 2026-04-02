import * as Sentry from "@sentry/cloudflare";

import { app } from "./app";

const SERVER_SENTRY_DSN =
  "https://c8445d18209776f911e62e1568537e74@o4510278858309632.ingest.us.sentry.io/4511149638221824";

const sentryOptions = () => ({
  dsn: SERVER_SENTRY_DSN,
  enableLogs: true,
  sendDefaultPii: true,
  tracesSampleRate: 1,
});

export default Sentry.withSentry(sentryOptions, app);
export type { AppType } from "./app";
