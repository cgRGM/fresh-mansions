import { db } from "@fresh-mansions/db";
import { appSetting, route, routeStop } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { checkMyRouteOnlinePlan } from "@/lib/myrouteonline";
import type { MyRouteOnlineRouteStop } from "@/lib/myrouteonline";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const MYROUTEONLINE_API_KEY_SETTING = "myrouteonline.apiKey";
const MIN_ROUTE_PLAN_CHECK_INTERVAL_MS = 5000;

const syncMyRouteOnlineRouteSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
});

const getMroStopAddressId = (stop: MyRouteOnlineRouteStop): null | number => {
  if (typeof stop.stopAddressId === "number") {
    return stop.stopAddressId;
  }

  return null;
};

export const syncMyRouteOnlineRoute = createServerFn({ method: "POST" })
  .inputValidator(syncMyRouteOnlineRouteSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const apiKeySetting = await db.query.appSetting.findFirst({
      where: eq(appSetting.key, MYROUTEONLINE_API_KEY_SETTING),
    });
    const apiKey = apiKeySetting?.value ?? null;

    if (!apiKey) {
      throw new Error("MYROUTEONLINE_API_KEY is not configured");
    }

    const routeRecord = await db.query.route.findFirst({
      where: eq(route.id, data.routeId),
      with: {
        stops: {
          orderBy: (table, { asc }) => [asc(table.sequence)],
        },
      },
    });

    if (!routeRecord) {
      throw new Error("Route not found");
    }

    if (!routeRecord.mroJobToken) {
      throw new Error("Send this route to MyRouteOnline first");
    }

    if (routeRecord.mroLastCheckedAt) {
      const elapsedMs = Date.now() - routeRecord.mroLastCheckedAt.getTime();

      if (elapsedMs < MIN_ROUTE_PLAN_CHECK_INTERVAL_MS) {
        const waitSeconds = Math.ceil(
          (MIN_ROUTE_PLAN_CHECK_INTERVAL_MS - elapsedMs) / 1000
        );
        throw new Error(
          `Wait ${String(waitSeconds)} more seconds before checking MyRouteOnline again`
        );
      }
    }

    await db
      .update(route)
      .set({ mroLastCheckedAt: new Date() })
      .where(eq(route.id, data.routeId));

    const response = await checkMyRouteOnlinePlan({
      apiKey,
      jobToken: routeRecord.mroJobToken,
    });

    if (!response.isSuccessful || response.processingStatus === "error") {
      await db
        .update(route)
        .set({
          mroError: response.errorMessage ?? "MyRouteOnline route failed",
          mroResponse: response,
          mroStatus: "failed",
        })
        .where(eq(route.id, data.routeId));

      throw new Error(response.errorMessage ?? "MyRouteOnline route failed");
    }

    if (!response.isFinished) {
      await db
        .update(route)
        .set({
          mroError: null,
          mroResponse: response,
          mroStatus: "processing",
        })
        .where(eq(route.id, data.routeId));

      return {
        isFinished: false,
        progress: response.processingProgress ?? null,
        routeId: data.routeId,
      };
    }

    const [mroRoute] = response.routes ?? [];
    const mroStops = mroRoute?.stops ?? [];
    const stopsByMroId = new Map<number, (typeof routeRecord.stops)[number]>();

    for (const [index, stop] of routeRecord.stops.entries()) {
      stopsByMroId.set(stop.mroStopAddressId ?? index + 1, stop);
    }

    const importedStopIds = new Set<string>();
    let nextSequence = 0;

    for (const mroStop of mroStops) {
      const stopAddressId = getMroStopAddressId(mroStop);

      if (stopAddressId === null || stopAddressId === 0) {
        continue;
      }

      const stop = stopsByMroId.get(stopAddressId);

      if (!stop) {
        continue;
      }

      importedStopIds.add(stop.id);

      await db
        .update(routeStop)
        .set({
          mroFullAddress: mroStop.fullAddress ?? null,
          mroStopAddressId: stopAddressId,
          mroStopNumber: mroStop.stopNumber ?? null,
          sequence: nextSequence,
        })
        .where(eq(routeStop.id, stop.id));

      nextSequence += 1;
    }

    if (importedStopIds.size !== routeRecord.stops.length) {
      throw new Error("MyRouteOnline result did not include every route stop");
    }

    await db
      .update(route)
      .set({
        mroAppNavigationUrl:
          mroRoute?.myRouteAppLaunchInfo?.myRouteAppDirectLaunchUrl ?? null,
        mroError: null,
        mroPrintAndDirectionsUrl:
          mroRoute?.myRouteAppLaunchInfo?.printAndDirectionsUrl ?? null,
        mroResponse: response,
        mroStatus: "finished",
        mroSyncedAt: new Date(),
        status: "ready",
      })
      .where(eq(route.id, data.routeId));

    return {
      importedStopIds: [...importedStopIds],
      isFinished: true,
      routeId: data.routeId,
    };
  });
