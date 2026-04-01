import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { getDashboard } from "@/functions/get-dashboard";
import { getPropertyDisplayAddress } from "@/lib/address";

const ordersRouteApi = getRouteApi("/app/orders");

const OrdersPage = () => {
  const { orders } = ordersRouteApi.useLoaderData();

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        {/* Header */}
        <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
            Work orders
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
            Scheduled services
          </h1>
          <p className="mt-1 text-sm text-black/45">
            Track the status of work assigned to your properties.
          </p>
        </div>

        {/* Content */}
        {orders.length === 0 ? (
          <EmptyState
            description="Once you accept a fixed quote, your scheduled work will appear here so you can track progress."
            illustration="sun"
            title="No active orders"
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <article
                className="group rounded-3xl border border-black/6 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:border-black/12 hover:shadow-md sm:p-6"
                key={order.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-bold tracking-[-0.02em] text-black">
                        {order.quote?.serviceType ?? "Service"}
                      </h2>
                      <p className="mt-1 text-sm text-black/50">
                        {getPropertyDisplayAddress(order.quote?.property)}
                      </p>
                      <p className="mt-1 text-xs text-black/40">
                        Crew:{" "}
                        {order.contractor?.displayName ?? "Awaiting assignment"}
                      </p>
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-[#0a1a10] text-white">
                    {order.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/app/orders")({
  component: OrdersPage,
  loader: () => getDashboard(),
});
