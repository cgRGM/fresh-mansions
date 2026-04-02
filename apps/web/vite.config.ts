import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const sentryPlugins = process.env.SENTRY_AUTH_TOKEN
  ? sentryTanstackStart({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "rocktown-labs-tq",
      project: "thirdtime-web",
    })
  : [];

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    ...sentryPlugins,
    viteReact(),
    alchemy(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
  server: {
    port: 3001,
  },
});
