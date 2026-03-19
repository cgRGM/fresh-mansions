import { expo } from "@better-auth/expo";
import { db } from "@fresh-mansions/db";
import * as schema from "@fresh-mansions/db/schema/auth";
import { env } from "@fresh-mansions/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
const isDevelopment = process.env.NODE_ENV === "development";

export const auth = betterAuth({
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    },
    // uncomment crossSubDomainCookies setting when ready to deploy and replace <your-workers-subdomain> with your actual workers subdomain
    // https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
    // crossSubDomainCookies: {
    //   enabled: true,
    //   domain: "<your-workers-subdomain>",
    // },
  },
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [expo()],
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: (request) => {
    const requestOrigin = request?.headers.get("origin");

    return [
      env.CORS_ORIGIN,
      ...(requestOrigin && LOCAL_ORIGIN_PATTERN.test(requestOrigin)
        ? [requestOrigin]
        : []),
      "fresh-mansions://",
      ...(isDevelopment
        ? [
            "exp://",
            "exp://**",
            "exp://192.168.*.*:*/**",
            "http://localhost:8081",
          ]
        : []),
    ];
  },
  // uncomment cookieCache setting when ready to deploy to Cloudflare using *.workers.dev domains
  // session: {
  //   cookieCache: {
  //     enabled: true,
  //     maxAge: 60,
  //   },
  // },
});
