import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../packages/infra/.env",
});

dotenv.config({
  path: "../../apps/server/.env",
});

export default defineConfig({
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    databaseId: process.env.CLOUDFLARE_DATABASE_ID ?? "",
    token: process.env.CLOUDFLARE_API_TOKEN ?? "",
  },
  dialect: "sqlite",
  driver: "d1-http",
  out: "./src/migrations",
  schema: "./src/schema",
  // DOCS: https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit
});
