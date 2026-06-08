import { db } from "@fresh-mansions/db";
import { buildFullAddress } from "@fresh-mansions/db/address";
import { appSetting, route, routeStop } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { startMyRouteOnlinePlan } from "@/lib/myrouteonline";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const MIN_MRO_ROUTE_STOPS = 3;
const MYROUTEONLINE_API_KEY_SETTING = "myrouteonline.apiKey";

const submitRouteToMyRouteOnlineSchema = z.object({
  departureTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 09:00")
    .optional(),
  routeId: z.string().min(1, "Route is required"),
  startAddress: z.string().optional(),
});

const getStopProperty = (stop: {
  property: null | {
    addressLine2: null | string;
    city: string;
    formattedAddress: null | string;
    state: string;
    street: string;
    zip: string;
  };
  workOrder: null | {
    quote: null | {
      property: null | {
        addressLine2: null | string;
        city: string;
        formattedAddress: null | string;
        state: string;
        street: string;
        zip: string;
      };
    };
  };
}) => stop.property ?? stop.workOrder?.quote?.property ?? null;

export const submitRouteToMyRouteOnline = createServerFn({ method: "POST" })
  .inputValidator(submitRouteToMyRouteOnlineSchema)
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
          with: {
            property: true,
            workOrder: {
              with: {
                quote: {
                  with: {
                    customer: { with: { user: true } },
                    property: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!routeRecord) {
      throw new Error("Route not found");
    }

    if (routeRecord.stops.length < MIN_MRO_ROUTE_STOPS) {
      throw new Error("Add at least 3 stops before sending to MyRouteOnline");
    }

    const addresses = routeRecord.stops.map((stop, index) => {
      const property = getStopProperty(stop);
      const address = buildFullAddress(property);

      if (!address) {
        throw new Error("Every stop needs a complete address before MRO sync");
      }

      return {
        address,
        ex: {
          comments: `Fresh Mansions route stop ${stop.id}`,
          routeStopId: stop.id,
          workOrderId: stop.workOrderId,
        },
        idNumber: index + 1,
        title:
          stop.property?.customer?.user?.name ??
          stop.workOrder?.quote?.customer?.user?.name ??
          `Stop ${String(index + 1)}`,
      };
    });

    const startAddress = data.startAddress;
    const response = await startMyRouteOnlinePlan({
      apiKey,
      request: {
        addresses,
        departureTime: data.departureTime,
        startAddress: startAddress
          ? {
              address: startAddress,
              ex: { comments: "Fresh Mansions route start" },
              idNumber: 0,
            }
          : undefined,
      },
    });

    if (!response.isSuccessful) {
      await db
        .update(route)
        .set({
          mroError: response.errorMessage ?? "MyRouteOnline rejected the route",
          mroResponse: response,
          mroStatus: "failed",
          mroSubmittedAt: new Date(),
        })
        .where(eq(route.id, data.routeId));

      throw new Error(response.errorMessage ?? "MyRouteOnline route failed");
    }

    await db
      .update(route)
      .set({
        mroError: null,
        mroJobToken: response.jobToken ?? null,
        mroResponse: response,
        mroStatus: response.isFinished ? "finished" : "processing",
        mroSubmittedAt: new Date(),
      })
      .where(eq(route.id, data.routeId));

    for (const [index, stop] of routeRecord.stops.entries()) {
      await db
        .update(routeStop)
        .set({ mroStopAddressId: index + 1 })
        .where(eq(routeStop.id, stop.id));
    }

    return {
      isFinished: response.isFinished ?? false,
      jobToken: response.jobToken ?? null,
      routeId: data.routeId,
    };
  });
