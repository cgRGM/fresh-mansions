import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createUpdateReturningChain,
  getMockDb,
  resetMockDb,
} from "./helpers/mock-db";
import { createSession } from "./helpers/test-session";

const createStripeAccountLinkMock = vi.fn();
const createStripeConnectedAccountMock = vi.fn();
const getAppSessionMock = vi.fn();

const adminSession = createSession({
  role: "admin",
  userId: "admin_user",
});

const buildRouteModule = async () => {
  vi.doMock("../../apps/server/src/lib/session", () => ({
    getAppSession: getAppSessionMock,
  }));
  vi.doMock("../../apps/server/src/lib/stripe", async () => {
    const actual = await vi.importActual<Record<string, unknown>>(
      "../../apps/server/src/lib/stripe"
    );

    return {
      ...actual,
      createStripeAccountLink: createStripeAccountLinkMock,
      createStripeConnectedAccount: createStripeConnectedAccountMock,
    };
  });

  const routeModulePath = "../../apps/server/src/routes/admin";
  const { default: route } = await import(routeModulePath);

  return { mockDb: getMockDb(), route };
};

describe("/api/admin", () => {
  beforeEach(() => {
    createStripeAccountLinkMock.mockReset();
    createStripeConnectedAccountMock.mockReset();
    getAppSessionMock.mockReset();
    resetMockDb();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    getAppSessionMock.mockResolvedValueOnce(null);

    const { route } = await buildRouteModule();
    const response = await route.request("/quotes");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("schedules a site visit and moves the quote to visit_scheduled", async () => {
    getAppSessionMock.mockResolvedValue(adminSession);

    const { mockDb, route } = await buildRouteModule();
    const updateChain = createUpdateReturningChain([
      {
        id: "quote_1",
        scheduledVisitAt: new Date("2026-06-10T15:00:00.000Z"),
        status: "visit_scheduled",
      },
    ]);

    mockDb.update.mockReturnValueOnce(updateChain.chain);

    const response = await route.request("/quotes/quote_1/schedule", {
      body: JSON.stringify({
        scheduledVisitAt: "2026-06-10T15:00:00.000Z",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(updateChain.set).toHaveBeenCalledWith({
      scheduledVisitAt: new Date("2026-06-10T15:00:00.000Z"),
      status: "visit_scheduled",
    });
  });

  it("blocks quote finalization until a visit is scheduled", async () => {
    getAppSessionMock.mockResolvedValue(adminSession);

    const { mockDb, route } = await buildRouteModule();

    mockDb.query.quote.findFirst.mockResolvedValueOnce({
      id: "quote_1",
      scheduledVisitAt: null,
    });

    const response = await route.request("/quotes/quote_1/finalize", {
      body: JSON.stringify({
        finalPrice: 24_000,
        proposedWorkDate: "2026-06-14",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Schedule the site visit before sending a quote",
    });
  });

  it("finalizes a quote with a fixed price and work date", async () => {
    getAppSessionMock.mockResolvedValue(adminSession);

    const { mockDb, route } = await buildRouteModule();
    const updateChain = createUpdateReturningChain([
      {
        finalPrice: 24_000,
        id: "quote_1",
        proposedWorkDate: "2026-06-14",
        status: "quote_sent",
      },
    ]);

    mockDb.query.quote.findFirst.mockResolvedValueOnce({
      id: "quote_1",
      scheduledVisitAt: new Date("2026-06-10T15:00:00.000Z"),
    });
    mockDb.update.mockReturnValueOnce(updateChain.chain);

    const response = await route.request("/quotes/quote_1/finalize", {
      body: JSON.stringify({
        finalPrice: 24_000,
        proposedWorkDate: "2026-06-14",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        finalPrice: 24_000,
        proposedWorkDate: "2026-06-14",
        status: "quote_sent",
      })
    );
  });

  it("creates a missing Stripe account on demand before generating onboarding links", async () => {
    getAppSessionMock.mockResolvedValue(adminSession);

    const { mockDb, route } = await buildRouteModule();
    const contractorUpdate = createUpdateReturningChain();

    mockDb.query.contractor.findFirst.mockResolvedValueOnce({
      contactEmail: "crew@example.com",
      id: "contractor_1",
      stripeAccountId: null,
      user: {
        email: "crew@example.com",
      },
    });
    mockDb.update.mockReturnValueOnce(contractorUpdate.chain);
    createStripeConnectedAccountMock.mockResolvedValueOnce({
      accountId: "acct_123",
    });
    createStripeAccountLinkMock.mockResolvedValueOnce({
      url: "https://connect.stripe.com/setup/s/test-link",
    });

    const response = await route.request(
      "/contractors/contractor_1/onboarding-link",
      {
        method: "POST",
      }
    );
    const payload = (await response.json()) as { onboardingUrl: string };

    expect(response.status).toBe(200);
    expect(createStripeConnectedAccountMock).toHaveBeenCalledWith({
      email: "crew@example.com",
    });
    expect(contractorUpdate.set).toHaveBeenCalledWith({
      stripeAccountId: "acct_123",
      stripeAccountStatus: "pending",
    });
    expect(createStripeAccountLinkMock).toHaveBeenCalledWith({
      accountId: "acct_123",
      refreshUrl: "http://localhost:3001/admin/contractors",
      returnUrl: "http://localhost:3001/contractor",
    });
    expect(payload.onboardingUrl).toBe(
      "https://connect.stripe.com/setup/s/test-link"
    );
  });
});
