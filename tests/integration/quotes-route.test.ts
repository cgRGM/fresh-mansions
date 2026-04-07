import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInsertChain, getMockDb, resetMockDb } from "./helpers/mock-db";
import { createSession } from "./helpers/test-session";

const session = createSession({
  customerId: "cust_1",
  role: "customer",
  userId: "user_1",
});

const getAppSessionMock = vi.fn();

const buildRouteModule = async () => {
  vi.doMock("../../apps/server/src/lib/session", () => ({
    getAppSession: getAppSessionMock,
  }));

  const routeModulePath = "../../apps/server/src/routes/quotes";
  const { default: route } = await import(routeModulePath);

  return { mockDb: getMockDb(), route };
};

describe("/api/quotes", () => {
  beforeEach(() => {
    getAppSessionMock.mockReset();
    resetMockDb();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    getAppSessionMock.mockResolvedValueOnce(null);

    const { route } = await buildRouteModule();
    const response = await route.request("/");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns customer quotes with computed property fullAddress", async () => {
    getAppSessionMock.mockResolvedValue(session);

    const { mockDb, route } = await buildRouteModule();

    mockDb.query.customer.findFirst.mockResolvedValueOnce({
      quotes: [
        {
          customerId: "cust_1",
          id: "quote_1",
          property: {
            city: "Harrisonburg",
            state: "VA",
            street: "123 Oak Street",
            zip: "22801",
          },
        },
      ],
    });

    const response = await route.request("/");
    const payload = (await response.json()) as {
      quotes: {
        property: {
          fullAddress: string;
        };
      }[];
    };

    expect(response.status).toBe(200);
    expect(payload.quotes).toHaveLength(1);
    expect(payload.quotes[0]?.property.fullAddress).toBe(
      "123 Oak Street, Harrisonburg, VA 22801"
    );
  });

  it("creates a quote with an existing property ID", async () => {
    getAppSessionMock.mockResolvedValue(session);

    const { mockDb, route } = await buildRouteModule();

    mockDb.query.customer.findFirst.mockResolvedValueOnce({
      id: "cust_1",
      userId: "user_1",
    });
    mockDb.query.property.findFirst.mockResolvedValueOnce({
      customerId: "cust_1",
      formattedAddress: "123 Oak Street, Harrisonburg, VA 22801",
      id: "prop_1",
      state: "VA",
      street: "123 Oak Street",
      zip: "22801",
    });

    const quoteInsert = createInsertChain();
    mockDb.insert.mockReturnValueOnce(quoteInsert.chain);

    const response = await route.request("/", {
      body: JSON.stringify({
        endDate: "2026-05-05",
        preferredVisitTime: "morning",
        propertyId: "prop_1",
        serviceType: "mowing",
        startDate: "2026-05-01",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(quoteInsert.values).toHaveBeenCalledTimes(1);
  });

  it("rejects existing property that does not belong to customer", async () => {
    getAppSessionMock.mockResolvedValue(session);

    const { mockDb, route } = await buildRouteModule();

    mockDb.query.customer.findFirst.mockResolvedValueOnce({
      id: "cust_1",
      userId: "user_1",
    });
    mockDb.query.property.findFirst.mockResolvedValueOnce(null);

    const response = await route.request("/", {
      body: JSON.stringify({
        endDate: "2026-05-05",
        preferredVisitTime: "morning",
        propertyId: "prop_missing",
        serviceType: "mowing",
        startDate: "2026-05-01",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Property not found" });
  });
});
