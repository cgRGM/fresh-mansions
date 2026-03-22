import { expo } from "@better-auth/expo";
import { stripe as stripePlugin } from "@better-auth/stripe";
import { db } from "@fresh-mansions/db";
import * as schema from "@fresh-mansions/db/schema/auth";
import { env } from "@fresh-mansions/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import StripeSdk from "stripe";

import { hashPassword, verifyPassword } from "./password";

const LOCAL_ORIGIN_PATTERN =
  /^https?:\/\/(?:[a-z0-9-]+\.)*(localhost|127\.0\.0\.1)(:\d+)?$/i;
const isDevelopment = process.env.NODE_ENV === "development";
const getHostname = (url: string): string => new URL(url).hostname;
const getSharedCookieDomain = (
  authUrl: string,
  appUrl: string
): null | string => {
  const authHostname = getHostname(authUrl);
  const appHostname = getHostname(appUrl);

  if (authHostname === appHostname) {
    return null;
  }

  const authParts = authHostname.split(".");
  const appParts = appHostname.split(".");
  const sharedParts: string[] = [];

  while (authParts.length > 0 && appParts.length > 0) {
    const authPart = authParts.at(-1);
    const appPart = appParts.at(-1);

    if (!authPart || !appPart || authPart !== appPart) {
      break;
    }

    sharedParts.unshift(authPart);
    authParts.pop();
    appParts.pop();
  }

  return sharedParts.length >= 2 ? sharedParts.join(".") : null;
};
const crossSubDomainCookieDomain = getSharedCookieDomain(
  env.BETTER_AUTH_URL,
  env.CORS_ORIGIN
);
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
    ...(crossSubDomainCookieDomain
      ? {
          crossSubDomainCookies: {
            domain: crossSubDomainCookieDomain,
            enabled: true,
          },
        }
      : {}),
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    },
  },
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
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
