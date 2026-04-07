import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, Map, MapPin } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { RadarStaticMap } from "@/components/radar-static-map";
import { getContractorRoutes } from "@/functions/contractor/get-contractor-routes";
import { getPropertyDisplayAddress } from "@/lib/address";

const routeApi = getRouteApi("/contractor/routes");

const routeStatusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  draft: "bg-black/8 text-black/60",
  in_progress: "bg-blue-100 text-blue-700",
  ready: "bg-amber-100 text-amber-700",
};

const ROUTE_COLORS = [
  "0x0a1a10",
  "0x2563eb",
  "0xdc2626",
  "0xd97706",
  "0x7c3aed",
  "0x0891b2",
  "0xdb2777",
  "0x059669",
];

interface RouteMapMarker {
  color: string;
  latitude: number;
  longitude: number;
}

type RouteData = Awaited<
  ReturnType<typeof getContractorRoutes>
>["routes"][number];

interface ContractorRoutesData {
  routes: RouteData[];
}

const RouteCard = ({
  route: r,
  today,
}: {
  readonly route: RouteData;
  readonly today: string;
}) => {
  const isToday = r.routeDate === today;
  const completedStops = r.stops.filter((s) => s.status === "completed").length;
  const totalStops = r.stops.length;

  // Build mini-map markers for this specific route
  const routeMarkers = useMemo(() => {
    const markers: RouteMapMarker[] = [];

    for (const stop of r.stops) {
      const prop = stop.property ?? stop.workOrder?.quote?.property ?? null;

      if (prop?.latitude && prop?.longitude) {
        markers.push({
          color: "0x0a1a10",
          latitude: Number(prop.latitude),
          longitude: Number(prop.longitude),
        });
      }
    }

    return markers;
  }, [r.stops]);

  return (
    <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 transition-all hover:border-black/12 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold tracking-[-0.02em] text-black">
              {r.name}
            </p>
            {isToday ? (
              <span className="rounded-full bg-[#d6f18b] px-2 py-0.5 text-[10px] font-semibold text-[#0a1a10]">
                TODAY
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-black/45">{r.routeDate}</p>
          <p className="mt-1 text-xs text-black/40">
            {completedStops}/{totalStops} stops completed
          </p>
        </div>
        <Badge
          className={routeStatusColors[r.status] ?? routeStatusColors.draft}
        >
          {r.status}
        </Badge>
      </div>

      {/* Mini map for this route */}
      {routeMarkers.length > 0 ? (
        <div className="mt-3 border-t border-black/5 pt-3">
          <RadarStaticMap
            className="h-[140px]"
            height={140}
            markers={routeMarkers}
            width={600}
          />
        </div>
      ) : null}

      {/* Stops preview */}
      {r.stops.length > 0 ? (
        <div className="mt-3 space-y-1.5 border-t border-black/5 pt-3">
          {r.stops.map((stop) => {
            const prop =
              stop.property ?? stop.workOrder?.quote?.property ?? null;
            const customerName =
              stop.property?.customer?.user?.name ??
              stop.workOrder?.quote?.customer?.user?.name ??
              "Unknown";
            const isDirect = !stop.workOrderId;

            return (
              <Link
                className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-black/4"
                key={stop.id}
                params={{ stopId: stop.id }}
                to="/contractor/stops/$stopId"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-black/5 text-[10px] font-bold text-black/40">
                  {stop.sequence + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-black/70">
                      {customerName}
                    </p>
                    {isDirect ? (
                      <Badge className="bg-violet-100 text-violet-700 text-[9px] px-1.5 py-0">
                        Direct
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-black/35">
                    <MapPin className="h-2.5 w-2.5" />
                    <span className="truncate">
                      {getPropertyDisplayAddress(prop)}
                    </span>
                  </div>
                </div>
                <Badge
                  className={`text-[10px] ${stop.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-black/8 text-black/60"}`}
                >
                  {stop.status}
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 text-black/20 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const ContractorRoutes = () => {
  const { routes } = routeApi.useLoaderData() as ContractorRoutesData;
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>("all");

  const handleRouteFilterChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setSelectedRouteFilter(event.target.value);
    },
    []
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcomingRoutes = routes.filter((r) => r.routeDate >= today);
  const pastRoutes = routes.filter((r) => r.routeDate < today);

  // Build map markers from all route stops
  const mapMarkers = useMemo(() => {
    const markers: RouteMapMarker[] = [];

    for (const [routeIndex, r] of routes.entries()) {
      if (selectedRouteFilter !== "all" && r.id !== selectedRouteFilter) {
        continue;
      }

      const color = ROUTE_COLORS[routeIndex % ROUTE_COLORS.length];

      for (const stop of r.stops) {
        const prop = stop.property ?? stop.workOrder?.quote?.property ?? null;

        if (prop?.latitude && prop?.longitude) {
          markers.push({
            color,
            latitude: Number(prop.latitude),
            longitude: Number(prop.longitude),
          });
        }
      }
    }

    return markers;
  }, [routes, selectedRouteFilter]);

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
            Routes
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-black">
            Your routes
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/50">
            View all routes assigned to you by dispatch. Tap any route to see
            its stops.
          </p>
        </div>

        {/* Route map */}
        {mapMarkers.length > 0 ? (
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                  <Map className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                    Overview
                  </p>
                  <h3 className="text-lg font-bold tracking-[-0.03em] text-black">
                    Route map
                  </h3>
                </div>
              </div>
              {routes.length > 1 ? (
                <select
                  className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm"
                  onChange={handleRouteFilterChange}
                  value={selectedRouteFilter}
                >
                  <option value="all">All routes</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.routeDate})
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            {/* Color legend */}
            {selectedRouteFilter === "all" && routes.length > 1 ? (
              <div className="mb-4 flex flex-wrap gap-3">
                {routes.map((r, index) => (
                  <div className="flex items-center gap-1.5" key={r.id}>
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: `#${(ROUTE_COLORS[index % ROUTE_COLORS.length] ?? "0a1a10").replace("0x", "")}`,
                      }}
                    />
                    <span className="text-xs text-black/50">{r.name}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <RadarStaticMap
              className="h-[280px] sm:h-[360px]"
              height={360}
              markers={mapMarkers}
              width={800}
            />
          </section>
        ) : null}

        {routes.length === 0 ? (
          <EmptyState
            description="No routes have been assigned to you yet. Routes will appear here once dispatch schedules them."
            illustration="leaf"
            title="No routes yet"
          />
        ) : (
          <>
            {/* Upcoming / Today */}
            {upcomingRoutes.length > 0 ? (
              <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                      Upcoming
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                      Scheduled routes
                    </h3>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  {upcomingRoutes.map((r) => (
                    <RouteCard key={r.id} route={r} today={today} />
                  ))}
                </div>
              </section>
            ) : null}

            {/* Past */}
            {pastRoutes.length > 0 ? (
              <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                      History
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                      Past routes
                    </h3>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {pastRoutes.map((r) => (
                    <RouteCard key={r.id} route={r} today={today} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/contractor/routes")({
  component: ContractorRoutes,
  loader: () => getContractorRoutes(),
});
