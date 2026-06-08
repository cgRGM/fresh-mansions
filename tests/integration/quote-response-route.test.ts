import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createInsertChain,
  createUpdateReturningChain,
  getMockDb,
  resetMockDb,
} from "./helpers/mock-db";
import { createSession } from "./helpers/test-session";

const getAppSessionMock = vi.fn();

const customerSession = createSession({
  customerId: "cust_1",
  role: "customer",
  userId: "user_1",
});

const buildRouteModule = async () => {
  vi.doMock("../../apps/server/src/lib/session", () => ({
    getAppSession: getAppSessionMock,
  }));

  const routeModulePath = "../../apps/server/src/routes/quotes";
  const { default: route } = await import(routeModulePath);

  return { mockDb: getMockDb(), route };
};

describe("/api/quotes/:id/respond", () => {
  beforeEach(() => {
    getAppSessionMock.mockReset();
    resetMockDb();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates a work order when a customer accepts a fixed quote", async () => {
    getAppSessionMock.mockResolvedValue(customerSession);

    const { mockDb, route } = await buildRouteModule();
    const workOrderInsert = createInsertChain();
    const quoteUpdate = createUpdateReturningChain([
      {
        id: "quote_1",
        status: "accepted",
      },
    ]);

    mockDb.query.quote.findFirst.mockResolvedValueOnce({
      customerId: "cust_1",
      id: "quote_1",
      notes: "Front beds plus edging",
      photos: [],
      preferredStartDate: "2026-06-12",
      property: null,
      proposedWorkDate: "2026-06-15",
    });
    mockDb.query.workOrder.findFirst.mockResolvedValueOnce(null);
    mockDb.insert.mockReturnValueOnce(workOrderInsert.chain);
    mockDb.update.mockReturnValueOnce(quoteUpdate.chain);

    const response = await route.request("/quote_1/respond", {
      body: JSON.stringify({
        status: "accepted",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(workOrderInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: "Front beds plus edging",
        quoteId: "quote_1",
        scheduledDate: "2026-06-15",
        status: "pending",
      })
    );
    expect(quoteUpdate.set).toHaveBeenCalledWith({
      status: "accepted",
    });
  });

  it("does not create a duplicate work order when one already exists", async () => {
    getAppSessionMock.mockResolvedValue(customerSession);

    const { mockDb, route } = await buildRouteModule();
    const quoteUpdate = createUpdateReturningChain([
      {
        id: "quote_1",
        status: "accepted",
      },
    ]);

    mockDb.query.quote.findFirst.mockResolvedValueOnce({
      customerId: "cust_1",
      id: "quote_1",
      notes: null,
      photos: [],
      preferredStartDate: "2026-06-12",
      property: null,
      proposedWorkDate: "2026-06-15",
    });
    mockDb.query.workOrder.findFirst.mockResolvedValueOnce({
      id: "wo_existing",
      quoteId: "quote_1",
    });
    mockDb.update.mockReturnValueOnce(quoteUpdate.chain);

    const response = await route.request("/quote_1/respond", {
      body: JSON.stringify({
        status: "accepted",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(quoteUpdate.set).toHaveBeenCalledWith({
      status: "accepted",
    });
  });

  it("does not create a work order when a quote is rejected", async () => {
    getAppSessionMock.mockResolvedValue(customerSession);

    const { mockDb, route } = await buildRouteModule();
    const quoteUpdate = createUpdateReturningChain([
      {
        id: "quote_1",
        status: "rejected",
      },
    ]);

    mockDb.query.quote.findFirst.mockResolvedValueOnce({
      customerId: "cust_1",
      id: "quote_1",
      notes: null,
      photos: [],
      preferredStartDate: "2026-06-12",
      property: null,
      proposedWorkDate: "2026-06-15",
    });
    mockDb.update.mockReturnValueOnce(quoteUpdate.chain);

    const response = await route.request("/quote_1/respond", {
      body: JSON.stringify({
        status: "rejected",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(quoteUpdate.set).toHaveBeenCalledWith({
      status: "rejected",
    });
  });

  it("returns 404 when a customer tries to respond to another customer's quote", async () => {
    getAppSessionMock.mockResolvedValue(customerSession);

    const { mockDb, route } = await buildRouteModule();

    mockDb.query.quote.findFirst.mockResolvedValueOnce({
      customerId: "cust_other",
      id: "quote_1",
      photos: [],
      property: null,
    });

    const response = await route.request("/quote_1/respond", {
      body: JSON.stringify({
        status: "accepted",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });
});
