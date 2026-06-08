import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checkMyRouteOnlinePlan,
  startMyRouteOnlinePlan,
} from "../../apps/web/src/lib/myrouteonline";

const getFetchBody = (): URLSearchParams => {
  const fetchCall = vi.mocked(fetch).mock.calls[0];
  const body = fetchCall?.[1]?.body;

  if (typeof body !== "string") {
    throw new TypeError("Expected URL-encoded body");
  }

  return new URLSearchParams(body);
};

describe("MyRouteOnline client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts route plans with URL-encoded apiToken and inRequest", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ isSuccessful: true, jobToken: "job_1" }),
        ok: true,
      })
    );

    await startMyRouteOnlinePlan({
      apiKey: "test-key",
      request: {
        addresses: [
          {
            address: "123 Main St, Harrisonburg, VA 22801",
            idNumber: 1,
          },
        ],
        departureTime: "09:00",
        startAddress: {
          address: "1 Depot Rd, Harrisonburg, VA",
          idNumber: 0,
        },
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://planner.myrouteonline.com/ws_api/?m=routePlanStart",
      expect.objectContaining({
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
      })
    );

    const body = getFetchBody();
    expect(body.get("apiToken")).toBe("test-key");
    expect(JSON.parse(body.get("inRequest") ?? "{}")).toMatchObject({
      additionalOutputRequest: { myRouteAppNavigationLaunchUrl: true },
      routesConstraints: {
        specificRouteConstraints: [
          {
            startTime: "09:00",
          },
        ],
      },
    });
  });

  it("checks route plans with URL-encoded apiToken and jobToken", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ isFinished: true, isSuccessful: true }),
        ok: true,
      })
    );

    await checkMyRouteOnlinePlan({
      apiKey: "test-key",
      jobToken: "job_1",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://planner.myrouteonline.com/ws_api/?m=routePlanCheck",
      expect.objectContaining({
        method: "POST",
      })
    );

    const body = getFetchBody();
    expect(body.get("apiToken")).toBe("test-key");
    expect(body.get("jobToken")).toBe("job_1");
  });
});
