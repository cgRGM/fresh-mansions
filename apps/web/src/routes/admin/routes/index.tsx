import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { addRouteStop } from "@/functions/admin/add-route-stop";
import { createRouteRecord } from "@/functions/admin/create-route";
import { listContractors } from "@/functions/admin/list-contractors";
import { listRoutes } from "@/functions/admin/list-routes";
import { listWorkOrders } from "@/functions/admin/list-work-orders";
import { getPropertyDisplayAddress } from "@/lib/address";

const adminRoutesRouteApi = getRouteApi("/admin/routes/");

const AdminRoutesPage = () => {
  const { contractors, routes, workOrders } =
    adminRoutesRouteApi.useLoaderData();
  const [routeForm, setRouteForm] = useState({
    contractorId: "",
    name: "",
    routeDate: "",
  });
  const [stopForm, setStopForm] = useState({
    routeId: "",
    sequence: "0",
    workOrderId: "",
  });

  const assignableOrders = useMemo(
    () => workOrders.filter((order) => order.status !== "completed"),
    [workOrders]
  );

  const handleRouteChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setRouteForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleStopChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setStopForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleCreateRoute = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        await createRouteRecord({
          data: {
            contractorId: routeForm.contractorId || undefined,
            name: routeForm.name,
            routeDate: routeForm.routeDate,
            status: "draft",
          },
        });
        toast.success("Route created");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create route"
        );
      }
    },
    [routeForm]
  );

  const handleAddStop = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        await addRouteStop({
          data: {
            routeId: stopForm.routeId,
            sequence: Number(stopForm.sequence),
            status: "pending",
            workOrderId: stopForm.workOrderId,
          },
        });
        toast.success("Stop added to route");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to add route stop"
        );
      }
    },
    [stopForm]
  );

  return (
    <div className="stagger-children space-y-5">
      <section className="grid gap-5 xl:grid-cols-2">
        <form
          className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          onSubmit={handleCreateRoute}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Route builder
              </p>
              <h1 className="text-xl font-bold tracking-[-0.03em] text-black sm:text-2xl">
                Create a daily run for a contractor
              </h1>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Route name</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="name"
                name="name"
                onChange={handleRouteChange}
                placeholder="Thursday South Loop"
                value={routeForm.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routeDate">Date</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="routeDate"
                name="routeDate"
                onChange={handleRouteChange}
                type="date"
                value={routeForm.routeDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractorId">Contractor</Label>
              <select
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                id="contractorId"
                name="contractorId"
                onChange={handleRouteChange}
                value={routeForm.contractorId}
              >
                <option value="">Unassigned</option>
                {contractors.map((contractor) => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.displayName}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="h-12 rounded-full bg-black px-5 text-white hover:bg-black/90"
              type="submit"
            >
              Create route
            </Button>
          </div>
        </form>

        <form
          className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          onSubmit={handleAddStop}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Stop placement
              </p>
              <h2 className="text-xl font-bold tracking-[-0.03em] text-black sm:text-2xl">
                Drop work orders into the route
              </h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="routeId">Route</Label>
              <select
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                id="routeId"
                name="routeId"
                onChange={handleStopChange}
                value={stopForm.routeId}
              >
                <option value="">Choose route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workOrderId">Work order</Label>
              <select
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                id="workOrderId"
                name="workOrderId"
                onChange={handleStopChange}
                value={stopForm.workOrderId}
              >
                <option value="">Choose work order</option>
                {assignableOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.quote?.customer?.user?.name ?? "Unknown"} /{" "}
                    {order.quote?.serviceType ?? "service"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sequence">Sequence</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="sequence"
                name="sequence"
                onChange={handleStopChange}
                type="number"
                value={stopForm.sequence}
              />
            </div>
            <Button
              className="h-12 rounded-full bg-black px-5 text-white hover:bg-black/90"
              type="submit"
            >
              Add stop
            </Button>
          </div>
        </form>
      </section>

      {routes.length === 0 ? (
        <EmptyState
          description="Create your first route above and start adding stops to build daily runs for your crews."
          illustration="leaf"
          title="No routes yet"
        />
      ) : (
        <section className="grid gap-5">
          {routes.map((route) => (
            <article
              className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              key={route.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                    {route.routeDate}
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.03em] text-black">
                    {route.name}
                  </h3>
                  <p className="mt-1 text-sm text-black/50">
                    {route.contractor?.displayName ??
                      "No contractor assigned yet"}
                  </p>
                </div>
                <div className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                  {route.stops.length} stops
                </div>
              </div>
              {route.stops.length > 0 && (
                <div className="mt-5 space-y-3">
                  {route.stops.map((stop) => (
                    <div
                      className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4"
                      key={stop.id}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                        Stop {stop.sequence + 1}
                      </p>
                      <p className="mt-2 font-medium text-black">
                        {stop.workOrder?.quote?.customer?.user?.name ??
                          "Unknown client"}
                      </p>
                      <p className="text-sm text-black/50">
                        {getPropertyDisplayAddress(
                          stop.workOrder?.quote?.property
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export const Route = createFileRoute("/admin/routes/")({
  component: AdminRoutesPage,
  loader: async () => ({
    contractors: await listContractors(),
    routes: await listRoutes(),
    workOrders: await listWorkOrders(),
  }),
});
