import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fresh-mansions/ui/components/table";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import type { ChangeEvent, MouseEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { assignWorkOrder } from "@/functions/admin/assign-work-order";
import { listContractors } from "@/functions/admin/list-contractors";
import { listRoutes } from "@/functions/admin/list-routes";
import { listWorkOrders } from "@/functions/admin/list-work-orders";
import { getPropertyDisplayAddress } from "@/lib/address";

const adminWorkOrdersRouteApi = getRouteApi("/admin/work-orders/");

const statusTone = (value: string) => {
  switch (value) {
    case "completed": {
      return "bg-[#d6f18b] text-black";
    }
    case "assigned": {
      return "bg-black text-white";
    }
    case "in_progress": {
      return "bg-amber-200 text-black";
    }
    default: {
      return "bg-black/6 text-black/65";
    }
  }
};

const AdminWorkOrdersPage = () => {
  const { contractors, routes, workOrders } =
    adminWorkOrdersRouteApi.useLoaderData();
  const [selectedContractors, setSelectedContractors] = useState<
    Record<string, string>
  >({});
  const [selectedRoutes, setSelectedRoutes] = useState<Record<string, string>>(
    {}
  );
  const [scheduledDates, setScheduledDates] = useState<Record<string, string>>(
    {}
  );

  const contractorOptions = useMemo(
    () =>
      contractors.map((contractor) => ({
        label: contractor.displayName,
        value: contractor.id,
      })),
    [contractors]
  );

  const handleAssign = useCallback(
    async (workOrderId: string) => {
      const contractorId = selectedContractors[workOrderId];

      if (!contractorId) {
        toast.error("Choose a contractor first");
        return;
      }

      try {
        await assignWorkOrder({
          data: {
            contractorId,
            routeId: selectedRoutes[workOrderId] || undefined,
            scheduledDate: scheduledDates[workOrderId] || undefined,
            workOrderId,
          },
        });
        toast.success("Work order assigned");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to assign work order"
        );
      }
    },
    [scheduledDates, selectedContractors, selectedRoutes]
  );

  const handleContractorChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { workOrderId } = event.currentTarget.dataset;

      if (!workOrderId) {
        return;
      }

      setSelectedContractors((current) => ({
        ...current,
        [workOrderId]: event.target.value,
      }));
    },
    []
  );

  const handleRouteChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { workOrderId } = event.currentTarget.dataset;

      if (!workOrderId) {
        return;
      }

      setSelectedRoutes((current) => ({
        ...current,
        [workOrderId]: event.target.value,
      }));
    },
    []
  );

  const handleScheduledDateChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { workOrderId } = event.currentTarget.dataset;

      if (!workOrderId) {
        return;
      }

      setScheduledDates((current) => ({
        ...current,
        [workOrderId]: event.target.value,
      }));
    },
    []
  );

  const handleAssignClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { workOrderId } = event.currentTarget.dataset;

      if (!workOrderId) {
        return;
      }

      handleAssign(workOrderId);
    },
    [handleAssign]
  );

  return (
    <div className="stagger-children space-y-5">
      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Dispatch board
            </p>
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
              Assign approved work to crews and routes
            </h1>
          </div>
        </div>
      </section>

      {workOrders.length === 0 ? (
        <EmptyState
          description="Work orders appear here once quotes are approved and converted. Check the Quotes tab to move requests forward."
          illustration="sun"
          title="No work orders yet"
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-black/6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((workOrder) => (
                <TableRow key={workOrder.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>
                        {workOrder.quote?.customer?.user?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-black/40">
                        {getPropertyDisplayAddress(workOrder.quote?.property)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{workOrder.quote?.serviceType ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={statusTone(workOrder.status)}>
                      {workOrder.status.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm"
                      data-work-order-id={workOrder.id}
                      onChange={handleContractorChange}
                      value={
                        selectedContractors[workOrder.id] ??
                        workOrder.contractorId ??
                        ""
                      }
                    >
                      <option value="">Select contractor</option>
                      {contractorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm"
                      data-work-order-id={workOrder.id}
                      onChange={handleRouteChange}
                      value={selectedRoutes[workOrder.id] ?? ""}
                    >
                      <option value="">No route</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Label
                        className="sr-only"
                        htmlFor={`scheduled-${workOrder.id}`}
                      >
                        Scheduled date
                      </Label>
                      <Input
                        className="h-10 rounded-xl border-black/10"
                        data-work-order-id={workOrder.id}
                        id={`scheduled-${workOrder.id}`}
                        onChange={handleScheduledDateChange}
                        type="date"
                        value={
                          scheduledDates[workOrder.id] ??
                          workOrder.scheduledDate ??
                          ""
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      className="h-10 rounded-full bg-black px-4 text-white hover:bg-black/90"
                      data-work-order-id={workOrder.id}
                      onClick={handleAssignClick}
                      type="button"
                    >
                      Assign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
};

export const Route = createFileRoute("/admin/work-orders/")({
  component: AdminWorkOrdersPage,
  loader: async () => ({
    contractors: await listContractors(),
    routes: await listRoutes(),
    workOrders: await listWorkOrders(),
  }),
});
