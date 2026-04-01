import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";

import { getTodaysRoute } from "@/functions/contractor/get-todays-route";
import { getPropertyDisplayAddress } from "@/lib/address";

const contractorRouteApi = getRouteApi("/contractor/");

const ContractorDashboard = () => {
  const { route, stops } = contractorRouteApi.useLoaderData();

  return (
    <div className="space-y-4">
      <section className="rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
          Today&apos;s route
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-black">
          {route?.name ?? "No route assigned today"}
        </h2>
        <p className="mt-2 text-sm text-black/58">
          {route?.routeDate ?? "Check back after dispatch finishes scheduling."}
        </p>
      </section>

      <section className="space-y-3">
        {stops.map((stop) => (
          <Link
            className="block rounded-[1.5rem] border border-black/8 bg-white p-4 shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
            key={stop.id}
            params={{ stopId: stop.id }}
            to="/contractor/stops/$stopId"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-black/40">
                  Stop {stop.sequence + 1}
                </p>
                <p className="mt-2 text-lg font-semibold text-black">
                  {stop.workOrder?.quote?.customer?.user?.name ??
                    "Unknown client"}
                </p>
                <p className="text-sm text-black/58">
                  {getPropertyDisplayAddress(stop.workOrder?.quote?.property)}
                </p>
              </div>
              <Badge className="bg-black text-white">{stop.status}</Badge>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
};

export const Route = createFileRoute("/contractor/")({
  component: ContractorDashboard,
  loader: () => getTodaysRoute(),
});
