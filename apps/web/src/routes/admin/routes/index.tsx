import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { addRouteStop } from "@/functions/admin/add-route-stop";
import { createRouteRecord } from "@/functions/admin/create-route";
import { listContractors } from "@/functions/admin/list-contractors";
import { listRoutes } from "@/functions/admin/list-routes";
import { listWorkOrders } from "@/functions/admin/list-work-orders";

export const Route = createFileRoute("/admin/routes/")({
  component: AdminRoutesPage,
  loader: async () => ({
    contractors: await listContractors(),
    routes: await listRoutes(),
    workOrders: await listWorkOrders(),
  }),
});

function AdminRoutesPage() {
  const { contractors, routes, workOrders } = Route.useLoaderData();
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
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-2">
        <form
          className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
          onSubmit={handleCreateRoute}
        >
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
            Route builder
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-black">
            Create a daily run for a contractor.
          </h1>
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
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3"
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
          className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
          onSubmit={handleAddStop}
        >
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
            Stop placement
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-black">
            Drop work orders into the route.
          </h2>
          <div className="mt-6 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="routeId">Route</Label>
              <select
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3"
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
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3"
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

      <section className="grid gap-4">
        {routes.map((route) => (
          <article
            className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
            key={route.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
                  {route.routeDate}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-black">
                  {route.name}
                </h3>
                <p className="mt-1 text-sm text-black/55">
                  {route.contractor?.displayName ??
                    "No contractor assigned yet"}
                </p>
              </div>
              <div className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                {route.stops.length} stops
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {route.stops.map((stop) => (
                <div
                  className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4"
                  key={stop.id}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/40">
                    Stop {stop.sequence + 1}
                  </p>
                  <p className="mt-2 font-medium text-black">
                    {stop.workOrder?.quote?.customer?.user?.name ??
                      "Unknown client"}
                  </p>
                  <p className="text-sm text-black/58">
                    {stop.workOrder?.quote?.property?.street ?? "No property"}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
