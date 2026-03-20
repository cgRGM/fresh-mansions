import { expo } from "@better-auth/expo";
import { stripe as stripePlugin } from "@better-auth/stripe";
import { db } from "@fresh-mansions/db";
import * as schema from "@fresh-mansions/db/schema/auth";
import { env } from "@fresh-mansions/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import StripeSdk from "stripe";

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
const isDevelopment = process.env.NODE_ENV === "development";
const stripeClient = env.STRIPE_SECRET_KEY
  ? new StripeSdk(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
  : null;
const authPlugins = [
  expo(),
  ...(stripeClient && env.STRIPE_WEBHOOK_SECRET
    ? [
        stripePlugin({
          createCustomerOnSignUp: true,
          getCustomerCreateParams: (user) =>
            Promise.resolve({
              metadata: {
                app: "fresh-mansions",
                role: "customer",
                userId: user.id,
              },
            }),
          stripeClient,
          stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
        }),
      ]
    : []),
];

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
  plugins: authPlugins,
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
