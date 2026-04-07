import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^cloudflare:workers$/,
        replacement: new URL(
          "tests/mocks/cloudflare-workers.ts",
          import.meta.url
        ).pathname,
      },
      {
        find: /^@fresh-mansions\/db$/,
        replacement: new URL(
          "tests/mocks/fresh-mansions-db.ts",
          import.meta.url
        ).pathname,
      },
    ],
  },
  test: {
    clearMocks: true,
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    mockReset: true,
    restoreMocks: true,
  },
});
