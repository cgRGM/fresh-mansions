interface MockBucketObject {
  body?: ReadableStream;
  httpMetadata?: {
    contentType?: string;
  };
}

const mockStorage = {
  get: (): Promise<null | MockBucketObject> => Promise.resolve(null),
  put: (): Promise<void> => Promise.resolve(),
};

const mockDb = {
  _type: "mock-db",
};

const getEnvValue = (key: string): string | undefined => {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
};

export const env = {
  BETTER_AUTH_SECRET: getEnvValue("BETTER_AUTH_SECRET") ?? "test-auth-secret",
  BETTER_AUTH_URL: getEnvValue("BETTER_AUTH_URL") ?? "http://localhost:3000",
  CORS_ORIGIN: getEnvValue("CORS_ORIGIN") ?? "http://localhost:3001",
  DB: mockDb,
  RADAR_SECRET_KEY: getEnvValue("RADAR_SECRET_KEY"),
  STORAGE: mockStorage,
  STRIPE_SECRET_KEY: getEnvValue("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: getEnvValue("STRIPE_WEBHOOK_SECRET"),
  SUPER_USER_EMAILS: getEnvValue("SUPER_USER_EMAILS"),
  TURNSTILE_SECRET_KEY: getEnvValue("TURNSTILE_SECRET_KEY"),
  VITE_RADAR_PUBLISHABLE_KEY: getEnvValue("VITE_RADAR_PUBLISHABLE_KEY"),
  VITE_SERVER_URL: getEnvValue("VITE_SERVER_URL") ?? "http://localhost:3000",
  VITE_TURNSTILE_SITE_KEY: getEnvValue("VITE_TURNSTILE_SITE_KEY"),
};
