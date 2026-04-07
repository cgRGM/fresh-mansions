import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Briefcase, Calendar, Wrench } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { getContractorWorkOrders } from "@/functions/contractor/get-contractor-work-orders";
import { getPropertyDisplayAddress } from "@/lib/address";

const routeApi = getRouteApi("/contractor/work-orders");

const workOrderStatusColors: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  pending: "bg-black/8 text-black/60",
};

type WorkOrderData = Awaited<
  ReturnType<typeof getContractorWorkOrders>
>["workOrders"][number];

const WorkOrderCard = ({
  workOrder: wo,
}: {
  readonly workOrder: WorkOrderData;
}) => (
  <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 transition-all hover:border-black/12 hover:shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold tracking-[-0.02em] text-black">
          {wo.quote?.customer?.user?.name ?? "Unknown client"}
        </p>
        <p className="mt-1 truncate text-xs text-black/45">
          {getPropertyDisplayAddress(wo.quote?.property)}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/40">
          {wo.quote?.serviceType ? (
            <span className="font-medium">{wo.quote.serviceType}</span>
          ) : null}
          {wo.scheduledDate ? (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {wo.scheduledDate}
            </span>
          ) : null}
        </div>
        {wo.notes ? (
          <p className="mt-2 text-xs leading-relaxed text-black/40">
            {wo.notes}
          </p>
        ) : null}
      </div>
      <Badge
        className={
          workOrderStatusColors[wo.status] ?? workOrderStatusColors.pending
        }
      >
        {wo.status}
      </Badge>
    </div>
  </div>
);

const ContractorWorkOrders = () => {
  const { workOrders } = routeApi.useLoaderData();

  const activeOrders = workOrders.filter(
    (wo) => wo.status !== "completed" && wo.status !== "cancelled"
  );
  const completedOrders = workOrders.filter((wo) => wo.status === "completed");

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
            Work Orders
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-black">
            Your jobs
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/50">
            All work orders assigned to you. Active jobs are listed first, with
            completed work below.
          </p>
        </div>

        {workOrders.length === 0 ? (
          <EmptyState
            description="No work orders have been assigned to you yet. When admin converts quotes and assigns them, they'll show up here."
            illustration="grass"
            title="No work orders yet"
          />
        ) : (
          <>
            {/* Active work orders */}
            {activeOrders.length > 0 ? (
              <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                      Active
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                      Jobs in progress
                    </h3>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                    <Wrench className="h-4 w-4 text-amber-600" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {activeOrders.map((wo) => (
                    <WorkOrderCard key={wo.id} workOrder={wo} />
                  ))}
                </div>
              </section>
            ) : null}

            {/* Completed work orders */}
            {completedOrders.length > 0 ? (
              <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                      Completed
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                      Finished jobs
                    </h3>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <Briefcase className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {completedOrders.map((wo) => (
                    <WorkOrderCard key={wo.id} workOrder={wo} />
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

export const Route = createFileRoute("/contractor/work-orders")({
  component: ContractorWorkOrders,
  loader: () => getContractorWorkOrders(),
});
