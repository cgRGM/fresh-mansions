import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "https://9a87030bdd0746fba8ced39c2bc07ae1@o4510278858309632.ingest.us.sentry.io/4511149589725184",
  enableLogs: true,
  sendDefaultPii: true,
  tracesSampleRate: 1,
});
