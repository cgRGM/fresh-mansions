import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute } from "@tanstack/react-router";

import { getDashboard } from "@/functions/get-dashboard";

export const Route = createFileRoute("/app/orders")({
  component: OrdersPage,
  loader: () => getDashboard(),
});

function OrdersPage() {
  const { orders } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
      <h1 className="text-3xl font-semibold tracking-[-0.06em] text-black">
        Orders
      </h1>
      {orders.map((order) => (
        <article
          className="rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
          key={order.id}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-black">
                {order.quote?.serviceType ?? "Service"}
              </p>
              <p className="mt-1 text-sm text-black/58">
                {order.quote?.property?.street ?? "No property address"}
              </p>
              <p className="text-sm text-black/58">
                Crew: {order.contractor?.displayName ?? "Awaiting assignment"}
              </p>
            </div>
            <Badge className="bg-black text-white">
              {order.status.replaceAll("_", " ")}
            </Badge>
          </div>
        </article>
      ))}
    </div>
  );
}
