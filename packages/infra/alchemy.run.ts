import alchemy from "alchemy";
import {
  D1Database,
  R2Bucket,
  TanStackStart,
  Worker,
} from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });
config({ path: "../../apps/server/.env" });

const requireBinding = <T>(value: T | undefined, name: string): T => {
  if (!value) {
    throw new Error(`Missing required binding: ${name}`);
  }

  return value;
};

const currentStage = process.env.ALCHEMY_STAGE ?? "dev";
const isCiEnvironment =
  process.env.CI !== undefined && process.env.CI !== "false";
const useRemoteStateStore = isCiEnvironment || currentStage !== "dev";

const app = await alchemy("fresh-mansions", {
  stateStore: useRemoteStateStore
    ? (scope) =>
        new CloudflareStateStore(scope, {
          scriptName: `fresh-mansions-state-${currentStage}`,
        })
    : undefined,
});
const betterAuthSecret = requireBinding(
  alchemy.secret.env.BETTER_AUTH_SECRET,
  "BETTER_AUTH_SECRET"
);
const betterAuthUrl = requireBinding(
  alchemy.env.BETTER_AUTH_URL,
  "BETTER_AUTH_URL"
);
const corsOrigin = requireBinding(alchemy.env.CORS_ORIGIN, "CORS_ORIGIN");
const viteServerUrl = requireBinding(
  alchemy.env.VITE_SERVER_URL,
  "VITE_SERVER_URL"
);
const radarSecretKey = process.env.RADAR_SECRET_KEY
  ? alchemy.secret(process.env.RADAR_SECRET_KEY, "RADAR_SECRET_KEY")
  : undefined;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  ? alchemy.secret(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY")
  : undefined;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  ? alchemy.secret(process.env.STRIPE_WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET")
  : undefined;
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY
  ? alchemy.secret(process.env.TURNSTILE_SECRET_KEY, "TURNSTILE_SECRET_KEY")
  : undefined;
const radarPublishableKey = process.env.VITE_RADAR_PUBLISHABLE_KEY;
const superUserEmails = process.env.SUPER_USER_EMAILS;
const turnstileSiteKey = process.env.VITE_TURNSTILE_SITE_KEY;

const db = await D1Database("database", {
  adopt: true,
  delete: false,
  migrationsDir: "../../packages/db/src/migrations",
  name: "fresh-mansions",
});
const storage = await R2Bucket("storage", {
  adopt: true,
  delete: false,
  name: "fresh-mansions",
});

const webBindings = {
  BETTER_AUTH_SECRET: betterAuthSecret,
  BETTER_AUTH_URL: betterAuthUrl,
  CORS_ORIGIN: corsOrigin,
  DB: db,
  STORAGE: storage,
  VITE_SERVER_URL: viteServerUrl,
  ...(radarSecretKey ? { RADAR_SECRET_KEY: radarSecretKey } : {}),
  ...(radarPublishableKey
    ? { VITE_RADAR_PUBLISHABLE_KEY: radarPublishableKey }
    : {}),
  ...(superUserEmails ? { SUPER_USER_EMAILS: superUserEmails } : {}),
  ...(stripeSecretKey ? { STRIPE_SECRET_KEY: stripeSecretKey } : {}),
  ...(stripeWebhookSecret
    ? { STRIPE_WEBHOOK_SECRET: stripeWebhookSecret }
    : {}),
  ...(turnstileSecretKey ? { TURNSTILE_SECRET_KEY: turnstileSecretKey } : {}),
  ...(turnstileSiteKey ? { VITE_TURNSTILE_SITE_KEY: turnstileSiteKey } : {}),
};

const serverBindings = {
  BETTER_AUTH_SECRET: betterAuthSecret,
  BETTER_AUTH_URL: betterAuthUrl,
  CORS_ORIGIN: corsOrigin,
  DB: db,
  STORAGE: storage,
  ...(superUserEmails ? { SUPER_USER_EMAILS: superUserEmails } : {}),
  ...(radarSecretKey ? { RADAR_SECRET_KEY: radarSecretKey } : {}),
  ...(stripeSecretKey ? { STRIPE_SECRET_KEY: stripeSecretKey } : {}),
  ...(stripeWebhookSecret
    ? { STRIPE_WEBHOOK_SECRET: stripeWebhookSecret }
    : {}),
  ...(turnstileSecretKey ? { TURNSTILE_SECRET_KEY: turnstileSecretKey } : {}),
};

export const web = await TanStackStart("web", {
  adopt: true,
  bindings: webBindings,
  cwd: "../../apps/web",
  name: "lawnapp-web",
});

export const server = await Worker("server", {
  adopt: true,
  bindings: serverBindings,
  compatibility: "node",
  cwd: "../../apps/server",
  dev: {
    port: 3000,
  },
  entrypoint: "src/index.ts",
  name: "lawnapp-server",
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
