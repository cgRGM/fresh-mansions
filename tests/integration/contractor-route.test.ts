import { beforeEach, describe, expect, it, vi } from "vitest";

import { createUpdateChain, getMockDb, resetMockDb } from "./helpers/mock-db";
import { createSession } from "./helpers/test-session";

const getAppSessionMock = vi.fn();

const buildRouteModule = async () => {
  vi.doMock("../../apps/server/src/lib/session", () => ({
    getAppSession: getAppSessionMock,
  }));

  const routeModulePath = "../../apps/server/src/routes/contractor";
  const { default: route } = await import(routeModulePath);

  return { mockDb: getMockDb(), route };
};

describe("/api/contractor/stops/:id/complete", () => {
  beforeEach(() => {
    getAppSessionMock.mockReset();
    resetMockDb();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 404 when user has no contractor profile", async () => {
    getAppSessionMock.mockResolvedValue(
      createSession({
        contractorId: null,
        role: "contractor",
      })
    );

    const { route } = await buildRouteModule();
    const response = await route.request("/stops/stop_1/complete", {
      body: JSON.stringify({ note: "done" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Stop not found" });
  });

  it("returns 404 when stop belongs to another contractor", async () => {
    getAppSessionMock.mockResolvedValue(
      createSession({
        contractorId: "contractor_a",
        role: "contractor",
      })
    );

    const { mockDb, route } = await buildRouteModule();

    mockDb.query.routeStop.findFirst.mockResolvedValueOnce({
      id: "stop_1",
      notes: null,
      route: {
        contractorId: "contractor_b",
      },
      workOrder: null,
      workOrderId: null,
    });

    const response = await route.request("/stops/stop_1/complete", {
      body: JSON.stringify({ note: "done" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Stop not found" });
  });

  it("completes stop and work order when contractor is authorized", async () => {
    getAppSessionMock.mockResolvedValue(
      createSession({
        contractorId: "contractor_a",
        role: "contractor",
      })
    );

    const { mockDb, route } = await buildRouteModule();

    mockDb.query.routeStop.findFirst.mockResolvedValueOnce({
      id: "stop_1",
      notes: "arrived",
      route: {
        contractorId: "contractor_a",
      },
      workOrder: {
        contractorId: "contractor_a",
        id: "wo_1",
      },
      workOrderId: "wo_1",
    });

    const stopUpdate = createUpdateChain();
    const workOrderUpdate = createUpdateChain();

    mockDb.update
      .mockReturnValueOnce(stopUpdate.chain)
      .mockReturnValueOnce(workOrderUpdate.chain);

    const response = await route.request("/stops/stop_1/complete", {
      body: JSON.stringify({ note: "finished" }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(stopUpdate.set).toHaveBeenCalledTimes(1);
    expect(workOrderUpdate.set).toHaveBeenCalledTimes(1);
  });
});
