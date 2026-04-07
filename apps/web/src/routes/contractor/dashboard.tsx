import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Map,
  TrendingUp,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { getContractorDashboard } from "@/functions/contractor/get-contractor-dashboard";
import { getPropertyDisplayAddress } from "@/lib/address";

const routeApi = getRouteApi("/contractor/dashboard");

const statusColors: Record<string, string> = {
  arrived: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  en_route: "bg-amber-100 text-amber-700",
  pending: "bg-black/8 text-black/60",
  skipped: "bg-red-100 text-red-700",
};

const getStopLabel = (count: number) => (count === 1 ? "stop" : "stops");

const ContractorDashboard = () => {
  const { contractor, recentRoutes, todayRoute, todayStops, workOrderStats } =
    routeApi.useLoaderData();
  const { session } = routeApi.useRouteContext();

  const firstName =
    contractor?.user?.name?.split(" ")[0] ??
    session.user.name?.split(" ")[0] ??
    "there";

  const completedToday = todayStops.filter(
    (s) => s.status === "completed"
  ).length;
  const totalToday = todayStops.length;
  const totalTodayLabel = getStopLabel(totalToday);

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        {/* Hero + Quick actions */}
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Dashboard
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-black sm:text-4xl">
              Hey, {firstName}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/50">
              {todayRoute
                ? `You have ${String(totalToday)} ${totalTodayLabel} on today's route. ${completedToday} completed so far.`
                : "No route assigned for today. Check back when dispatch finishes scheduling."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: ClipboardList,
                  label: "Assigned",
                  value: String(workOrderStats.assigned),
                },
                {
                  icon: Clock,
                  label: "In Progress",
                  value: String(workOrderStats.inProgress),
                },
                {
                  icon: CheckCircle2,
                  label: "Completed",
                  value: String(workOrderStats.completed),
                },
                {
                  icon: TrendingUp,
                  label: "Today's Stops",
                  value: `${String(completedToday)}/${String(totalToday)}`,
                },
              ].map((item) => (
                <div
                  className="group rounded-2xl border border-black/5 bg-[#f4f2ec]/60 p-4 transition-colors hover:bg-[#f4f2ec]"
                  key={item.label}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5 text-black/30" />
                    <p className="text-xs font-medium text-black/45">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1a10] to-[#141414] p-6 text-white shadow-[0_16px_50px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,_oklch(0.6_0.15_140_/_0.08),_transparent_50%)]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                Quick actions
              </p>
              <div className="mt-5 space-y-2.5">
                {todayRoute ? (
                  <Link className="block" to="/contractor/routes">
                    <div className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3.5 transition-all hover:border-[#d6f18b]/20 hover:bg-[#d6f18b]/8">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d6f18b]/15">
                        <Map className="h-4 w-4 text-[#d6f18b]" />
                      </div>
                      <span className="text-sm font-medium text-white/80 group-hover:text-white">
                        View today&apos;s route
                      </span>
                      <ArrowRight className="ml-auto h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-[#d6f18b]" />
                    </div>
                  </Link>
                ) : null}
                <Link className="block" to="/contractor/work-orders">
                  <div className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3.5 transition-all hover:border-white/15 hover:bg-white/8">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8">
                      <ClipboardList className="h-4 w-4 text-white/60" />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-white">
                      View all work orders
                    </span>
                    <ArrowRight className="ml-auto h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
                  </div>
                </Link>
                <Link className="block" to="/contractor/routes">
                  <div className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3.5 transition-all hover:border-white/15 hover:bg-white/8">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8">
                      <Calendar className="h-4 w-4 text-white/60" />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-white">
                      Route history
                    </span>
                    <ArrowRight className="ml-auto h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
                  </div>
                </Link>
              </div>
            </div>
          </aside>
        </section>

        {/* Today's route stops */}
        {todayStops.length > 0 ? (
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                  Today&apos;s Route
                </p>
                <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                  {todayRoute?.name ?? "Route"}
                </h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <Map className="h-4 w-4 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-2.5">
              {todayStops.map((stop) => (
                <Link
                  className="group block rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 transition-all hover:border-black/12 hover:shadow-sm"
                  key={stop.id}
                  params={{ stopId: stop.id }}
                  to="/contractor/stops/$stopId"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/30">
                          Stop {stop.sequence + 1}
                        </span>
                      </div>
                      <p className="mt-1.5 font-semibold tracking-[-0.02em] text-black">
                        {stop.workOrder?.quote?.customer?.user?.name ??
                          "Unknown client"}
                      </p>
                      <p className="mt-1 truncate text-xs text-black/45">
                        {getPropertyDisplayAddress(
                          stop.workOrder?.quote?.property
                        )}
                      </p>
                      {stop.workOrder?.quote?.serviceType ? (
                        <p className="mt-1.5 text-xs font-medium text-black/40">
                          {stop.workOrder.quote.serviceType}
                        </p>
                      ) : null}
                    </div>
                    <Badge
                      className={
                        statusColors[stop.status] ?? statusColors.pending
                      }
                    >
                      {stop.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            description="No route has been assigned to you for today. When dispatch creates your route, it will appear here with all your stops."
            illustration="sun"
            title="No route for today"
          />
        )}

        {/* Recent routes */}
        {recentRoutes.length > 0 ? (
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                  Recent routes
                </p>
                <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                  Past assignments
                </h3>
              </div>
              <Link
                className="text-xs font-medium text-black/40 transition hover:text-black"
                to="/contractor/routes"
              >
                View all →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recentRoutes.map((r) => (
                <Link
                  className="group rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 transition-all hover:border-black/12 hover:shadow-sm"
                  key={r.id}
                  to="/contractor/routes"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold tracking-[-0.02em] text-black">
                        {r.name}
                      </p>
                      <p className="mt-1 text-xs text-black/45">
                        {r.routeDate}
                      </p>
                    </div>
                    <Badge
                      className={
                        r.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-black/8 text-black/60"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-black/40">
                    {r.stops.length} {getStopLabel(r.stops.length)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/contractor/dashboard")({
  component: ContractorDashboard,
  loader: () => getContractorDashboard(),
});
