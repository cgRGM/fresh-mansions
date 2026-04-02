import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import Loader from "./components/loader";

import "./index.css";
import { routeTree } from "./routeTree.gen";

const addReplayIntegration = async () => {
  const browserSentry = await import("@sentry/tanstackstart-react");
  const replayIntegration = browserSentry.replayIntegration?.();

  if (replayIntegration) {
    Sentry.addIntegration(replayIntegration);
  }
};

export const getRouter = () => {
  const router = createTanStackRouter({
    Wrap: ({ children }) => children,
    context: {},
    defaultNotFoundComponent: () => <div>Not Found</div>,
    defaultPendingComponent: () => <Loader />,
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  });

  if (typeof window !== "undefined" && !Sentry.getClient()) {
    Sentry.init({
      dsn: "https://9a87030bdd0746fba8ced39c2bc07ae1@o4510278858309632.ingest.us.sentry.io/4511149589725184",
      enableLogs: true,
      integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
      replaysOnErrorSampleRate: 1,
      replaysSessionSampleRate: 0.1,
      sendDefaultPii: true,
      tracesSampleRate: 1,
    });

    addReplayIntegration();
  }

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
