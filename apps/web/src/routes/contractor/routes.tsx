import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, MapPin } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { getContractorRoutes } from "@/functions/contractor/get-contractor-routes";
import { getPropertyDisplayAddress } from "@/lib/address";

const routeApi = getRouteApi("/contractor/routes");

const routeStatusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  draft: "bg-black/8 text-black/60",
  in_progress: "bg-blue-100 text-blue-700",
  ready: "bg-amber-100 text-amber-700",
};

const ContractorRoutes = () => {
  const { routes } = routeApi.useLoaderData();

  const today = new Date().toISOString().slice(0, 10);
  const upcomingRoutes = routes.filter((r) => r.routeDate >= today);
  const pastRoutes = routes.filter((r) => r.routeDate < today);

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

type RouteData = Awaited<
  ReturnType<typeof getContractorRoutes>
>["routes"][number];

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

      {/* Stops preview */}
      {r.stops.length > 0 ? (
        <div className="mt-3 space-y-1.5 border-t border-black/5 pt-3">
          {r.stops.map((stop) => (
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
                <p className="truncate text-sm font-medium text-black/70">
                  {stop.workOrder?.quote?.customer?.user?.name ?? "Unknown"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-black/35">
                  <MapPin className="h-2.5 w-2.5" />
                  <span className="truncate">
                    {getPropertyDisplayAddress(stop.workOrder?.quote?.property)}
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
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const Route = createFileRoute("/contractor/routes")({
  component: ContractorRoutes,
  loader: () => getContractorRoutes(),
});
