import { db } from "@fresh-mansions/db";
import { routeStop } from "@fresh-mansions/db/schema/domain";
import { env } from "@fresh-mansions/env/server";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const MAX_OPTIMIZABLE_STOPS = 10;

interface RadarOptimizeLeg {
  endIndex: number;
  startIndex: number;
}

interface RadarOptimizeResponse {
  route?: {
    legs?: RadarOptimizeLeg[];
  };
}

const optimizeRouteStopsSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
});

const getStopCoordinates = (stop: {
  property: null | {
    latitude: null | number;
    longitude: null | number;
  };
  workOrder: null | {
    quote: null | {
      property: null | {
        latitude: null | number;
        longitude: null | number;
      };
    };
  };
}) => {
  const property = stop.property ?? stop.workOrder?.quote?.property ?? null;

  if (typeof property?.latitude !== "number") {
    return null;
  }

  if (typeof property.longitude !== "number") {
    return null;
  }

  return {
    latitude: property.latitude,
    longitude: property.longitude,
  };
};

const deriveOptimizedOrder = (
  legs: RadarOptimizeLeg[],
  stopCount: number
): number[] => {
  if (legs.length !== stopCount - 1) {
    throw new Error("Route optimization response was incomplete");
  }

  const nextByStart = new Map<number, number>();

  for (const leg of legs) {
    if (nextByStart.has(leg.startIndex)) {
      throw new Error("Route optimization response was invalid");
    }

    nextByStart.set(leg.startIndex, leg.endIndex);
  }

  const order = [0];
  const visited = new Set<number>(order);
  let currentIndex = 0;

  while (nextByStart.has(currentIndex)) {
    const nextIndex = nextByStart.get(currentIndex);

    if (typeof nextIndex !== "number") {
      break;
    }

    if (visited.has(nextIndex)) {
      throw new Error("Route optimization response created a cycle");
    }

    order.push(nextIndex);
    visited.add(nextIndex);
    currentIndex = nextIndex;
  }

  if (order.length !== stopCount) {
    throw new Error("Route optimization response missed one or more stops");
  }

  const finalIndex = stopCount - 1;

  if (order.at(-1) !== finalIndex) {
    throw new Error("Route optimization did not preserve final destination");
  }

  return order;
};

export const optimizeRouteStops = createServerFn({ method: "POST" })
  .inputValidator(optimizeRouteStopsSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    if (!env.RADAR_SECRET_KEY) {
      throw new Error("RADAR_SECRET_KEY is not configured");
    }

    const stops = await db.query.routeStop.findMany({
      orderBy: (table, { asc }) => [asc(table.sequence)],
      where: eq(routeStop.routeId, data.routeId),
      with: {
        property: true,
        workOrder: {
          with: {
            quote: {
              with: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (stops.length < 3) {
      throw new Error("Add at least 3 stops to optimize this route");
    }

    if (stops.length > MAX_OPTIMIZABLE_STOPS) {
      throw new Error(
        `Route optimization supports up to ${String(MAX_OPTIMIZABLE_STOPS)} stops`
      );
    }

    const locations: string[] = [];

    for (const stop of stops) {
      const coordinates = getStopCoordinates(stop);

      if (!coordinates) {
        throw new Error(
          "All stops need valid coordinates before optimization can run"
        );
      }

      locations.push(
        `${String(coordinates.latitude)},${String(coordinates.longitude)}`
      );
    }

    const optimizeUrl = new URL("https://api.radar.io/v1/route/optimize");
    optimizeUrl.searchParams.set("locations", locations.join("|"));
    optimizeUrl.searchParams.set("mode", "car");
    optimizeUrl.searchParams.set("units", "imperial");

    const optimizeResponse = await fetch(optimizeUrl, {
      headers: {
        Authorization: env.RADAR_SECRET_KEY,
      },
    });

    if (!optimizeResponse.ok) {
      throw new Error("Radar route optimization failed");
    }

    const optimizePayload =
      (await optimizeResponse.json()) as RadarOptimizeResponse;
    const optimizedIndices = deriveOptimizedOrder(
      optimizePayload.route?.legs ?? [],
      stops.length
    );

    const optimizedStopIds: string[] = [];

    for (const [sequence, stopIndex] of optimizedIndices.entries()) {
      const stop = stops[stopIndex];

      if (!stop) {
        throw new Error(
          "Route optimization response referenced an invalid stop"
        );
      }

      await db
        .update(routeStop)
        .set({ sequence })
        .where(eq(routeStop.id, stop.id));

      optimizedStopIds.push(stop.id);
    }

    return {
      optimizedStopIds,
      routeId: data.routeId,
    };
  });
