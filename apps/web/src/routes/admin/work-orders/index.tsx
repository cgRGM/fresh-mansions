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
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { assignWorkOrder } from "@/functions/admin/assign-work-order";
import { listContractors } from "@/functions/admin/list-contractors";
import { listRoutes } from "@/functions/admin/list-routes";
import { listWorkOrders } from "@/functions/admin/list-work-orders";

export const Route = createFileRoute("/admin/work-orders/")({
  component: AdminWorkOrdersPage,
  loader: async () => ({
    contractors: await listContractors(),
    routes: await listRoutes(),
    workOrders: await listWorkOrders(),
  }),
});

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

function AdminWorkOrdersPage() {
  const { contractors, routes, workOrders } = Route.useLoaderData();
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

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
          Dispatch board
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-black">
          Assign approved work to crews and place it on the day’s route.
        </h1>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
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
                    <p>{workOrder.quote?.customer?.user?.name ?? "Unknown"}</p>
                    <p className="text-xs text-black/50">
                      {workOrder.quote?.property?.street ?? "No property"}
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
                    onChange={(event) =>
                      setSelectedContractors((current) => ({
                        ...current,
                        [workOrder.id]: event.target.value,
                      }))
                    }
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
                    onChange={(event) =>
                      setSelectedRoutes((current) => ({
                        ...current,
                        [workOrder.id]: event.target.value,
                      }))
                    }
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
                      id={`scheduled-${workOrder.id}`}
                      onChange={(event) =>
                        setScheduledDates((current) => ({
                          ...current,
                          [workOrder.id]: event.target.value,
                        }))
                      }
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
                    onClick={() => handleAssign(workOrder.id)}
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
    </div>
  );
}
