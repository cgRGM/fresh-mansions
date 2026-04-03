import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  MapPin,
  Plus,
} from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import type { MapMarker } from "@/components/radar-route-map";
import { RadarStaticMap } from "@/components/radar-static-map";
import { addPropertyToRoute } from "@/functions/admin/add-property-to-route";
import { addRouteStop } from "@/functions/admin/add-route-stop";
import { createRouteRecord } from "@/functions/admin/create-route";
import { listContractors } from "@/functions/admin/list-contractors";
import { listProperties } from "@/functions/admin/list-properties";
import { listRoutes } from "@/functions/admin/list-routes";
import { listWorkOrders } from "@/functions/admin/list-work-orders";
import { getPropertyDisplayAddress } from "@/lib/address";

const adminRoutesRouteApi = getRouteApi("/admin/routes/");

type RouteRecord = Awaited<ReturnType<typeof listRoutes>>[number];

const ROUTE_COLORS = [
  "0x0a1a10",
  "0x2563eb",
  "0xdc2626",
  "0xd97706",
  "0x7c3aed",
  "0x0891b2",
  "0xdb2777",
  "0x059669",
];

const AdminRoutesPage = () => {
  const { contractors, properties, routes, workOrders } =
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
  const [propertyForm, setPropertyForm] = useState({
    propertyId: "",
    routeId: "",
  });
  const [expandedRouteId, setExpandedRouteId] = useState<null | string>(null);
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>("all");

  const assignableOrders = useMemo(
    () => workOrders.filter((order) => order.status !== "completed"),
    [workOrders]
  );

  // Build map markers from all routes
  const allMapMarkers = useMemo(() => {
    const markers: (MapMarker & { routeId: string })[] = [];

    for (const [routeIndex, route] of routes.entries()) {
      const color = ROUTE_COLORS[routeIndex % ROUTE_COLORS.length];

      for (const stop of route.stops) {
        const prop = stop.property ?? stop.workOrder?.quote?.property ?? null;

        if (!prop?.latitude || !prop?.longitude) {
          continue;
        }

        const customerName =
          stop.property?.customer?.user?.name ??
          stop.workOrder?.quote?.customer?.user?.name ??
          "Unknown";

        markers.push({
          address: getPropertyDisplayAddress(prop),
          color,
          id: stop.id,
          label: `${route.name} · Stop ${String(stop.sequence + 1)} · ${customerName}`,
          latitude: prop.latitude,
          longitude: prop.longitude,
          routeId: route.id,
        });
      }
    }

    return markers;
  }, [routes]);

  const filteredMarkers = useMemo(
    () =>
      selectedRouteFilter === "all"
        ? allMapMarkers
        : allMapMarkers.filter((m) => m.routeId === selectedRouteFilter),
    [allMapMarkers, selectedRouteFilter]
  );

  // Unassigned properties (properties that are not on any route)
  const assignedPropertyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const route of routes) {
      for (const stop of route.stops) {
        if (stop.propertyId) {
          ids.add(stop.propertyId);
        }
        const woPropertyId = stop.workOrder?.quote?.property?.id;
        if (woPropertyId) {
          ids.add(woPropertyId);
        }
      }
    }
    return ids;
  }, [routes]);

  const unassignedProperties = useMemo(
    () => properties.filter((p) => !assignedPropertyIds.has(p.id)),
    [assignedPropertyIds, properties]
  );

  const handleRouteChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setRouteForm((current) => ({ ...current, [name]: value }));
    },
    []
  );

  const handleStopChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setStopForm((current) => ({ ...current, [name]: value }));
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

  const handleAddProperty = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        await addPropertyToRoute({
          data: {
            propertyId: propertyForm.propertyId,
            routeId: propertyForm.routeId,
          },
        });
        toast.success("Property added to route");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to add property"
        );
      }
    },
    [propertyForm]
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedRouteId((current) => (current === id ? null : id));
  }, []);

  return (
    <div className="stagger-children space-y-5">
      {/* Map section */}
      {filteredMarkers.length > 0 ? (
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                  Route map
                </p>
                <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
                  All stops visualized
                </h2>
              </div>
            </div>
            <select
              className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-sm"
              onChange={(e) => setSelectedRouteFilter(e.target.value)}
              value={selectedRouteFilter}
            >
              <option value="all">All routes</option>
              {routes.map((r, i) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.routeDate})
                </option>
              ))}
            </select>
          </div>

          {/* Route color legend */}
          <div className="mb-4 flex flex-wrap gap-3">
            {routes.map((r, i) => (
              <div className="flex items-center gap-1.5" key={r.id}>
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: `#${ROUTE_COLORS[i % ROUTE_COLORS.length].slice(2)}`,
                  }}
                />
                <span className="text-xs font-medium text-black/50">
                  {r.name}
                </span>
              </div>
            ))}
          </div>

          <RadarStaticMap
            className="h-[400px]"
            height={400}
            markers={filteredMarkers.map((m) => ({
              color: m.color,
              latitude: m.latitude,
              longitude: m.longitude,
            }))}
            style="radar-light-v1"
            width={1200}
          />
        </section>
      ) : null}

      {/* Forms grid */}
      <section className="grid gap-5 xl:grid-cols-3">
        {/* Create route */}
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
              <h3 className="text-lg font-bold tracking-[-0.03em] text-black">
                Create a daily run
              </h3>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Route name</Label>
              <Input
                className="h-11 rounded-2xl border-black/10"
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
                className="h-11 rounded-2xl border-black/10"
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
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                id="contractorId"
                name="contractorId"
                onChange={handleRouteChange}
                value={routeForm.contractorId}
              >
                <option value="">Unassigned</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
              type="submit"
            >
              Create route
            </Button>
          </div>
        </form>

        {/* Add property to route (no work order needed) */}
        <form
          className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          onSubmit={handleAddProperty}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d6f18b]/30 text-[#0a1a10]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Direct assign
              </p>
              <h3 className="text-lg font-bold tracking-[-0.03em] text-black">
                Add property to route
              </h3>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-black/40">
            Add any client property directly to a route — no work order needed.
          </p>
          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="prop-routeId">Route</Label>
              <select
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                id="prop-routeId"
                onChange={(e) =>
                  setPropertyForm((s) => ({ ...s, routeId: e.target.value }))
                }
                value={propertyForm.routeId}
              >
                <option value="">Choose route</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.routeDate})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-propertyId">
                Property{" "}
                <span className="text-black/30">
                  ({unassignedProperties.length} unassigned)
                </span>
              </Label>
              <select
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                id="prop-propertyId"
                onChange={(e) =>
                  setPropertyForm((s) => ({
                    ...s,
                    propertyId: e.target.value,
                  }))
                }
                value={propertyForm.propertyId}
              >
                <option value="">Choose property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.customer?.user?.name ?? "Unknown"} — {p.fullAddress}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="h-11 rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800"
              type="submit"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to route
            </Button>
          </div>
        </form>

        {/* Add work order stop */}
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
                Work order stop
              </p>
              <h3 className="text-lg font-bold tracking-[-0.03em] text-black">
                Add from work orders
              </h3>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="routeId">Route</Label>
              <select
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                id="routeId"
                name="routeId"
                onChange={handleStopChange}
                value={stopForm.routeId}
              >
                <option value="">Choose route</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workOrderId">Work order</Label>
              <select
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
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
                className="h-11 rounded-2xl border-black/10"
                id="sequence"
                name="sequence"
                onChange={handleStopChange}
                type="number"
                value={stopForm.sequence}
              />
            </div>
            <Button
              className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
              type="submit"
            >
              Add stop
            </Button>
          </div>
        </form>
      </section>

      {/* Route list */}
      {routes.length === 0 ? (
        <EmptyState
          description="Create your first route above and start adding stops to build daily runs for your crews."
          illustration="leaf"
          title="No routes yet"
        />
      ) : (
        <section className="grid gap-5">
          {routes.map((route, routeIndex) => (
            <RouteCard
              contractors={contractors}
              expanded={expandedRouteId === route.id}
              key={route.id}
              onToggle={() => toggleExpanded(route.id)}
              route={route}
              routeColor={ROUTE_COLORS[routeIndex % ROUTE_COLORS.length]}
            />
          ))}
        </section>
      )}
    </div>
  );
};

const RouteCard = ({
  expanded,
  onToggle,
  route,
  routeColor,
}: {
  readonly contractors: Awaited<ReturnType<typeof listContractors>>;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly route: RouteRecord;
  readonly routeColor: string;
}) => {
  const stopsWithCoords = route.stops.filter((stop) => {
    const prop = stop.property ?? stop.workOrder?.quote?.property ?? null;
    return prop?.latitude && prop?.longitude;
  });

  return (
    <article className="rounded-3xl border border-black/6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <button
        className="flex w-full items-start justify-between gap-4 p-6 text-left"
        onClick={onToggle}
        type="button"
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-1 h-4 w-4 flex-shrink-0 rounded-full"
            style={{
              backgroundColor: `#${routeColor.slice(2)}`,
            }}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              {route.routeDate}
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-[-0.03em] text-black">
              {route.name}
            </h3>
            <p className="mt-1 text-sm text-black/50">
              {route.contractor?.displayName ?? "No contractor assigned yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-black text-white">
            {route.stops.length} stops
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-black/30" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black/30" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-black/6 p-6">
          {/* Mini map for this route */}
          {stopsWithCoords.length > 0 ? (
            <div className="mb-5">
              <RadarStaticMap
                className="h-[250px]"
                height={250}
                markers={stopsWithCoords.map((stop) => {
                  const prop = stop.property ?? stop.workOrder?.quote?.property;
                  return {
                    color: routeColor,
                    latitude: prop!.latitude!,
                    longitude: prop!.longitude!,
                  };
                })}
                style="radar-light-v1"
                width={1000}
              />
            </div>
          ) : null}

          {route.stops.length > 0 ? (
            <div className="space-y-3">
              {route.stops.map((stop) => {
                const prop =
                  stop.property ?? stop.workOrder?.quote?.property ?? null;
                const customerName =
                  stop.property?.customer?.user?.name ??
                  stop.workOrder?.quote?.customer?.user?.name ??
                  "Unknown client";
                const isDirectProperty = stop.propertyId && !stop.workOrderId;

                return (
                  <div
                    className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4"
                    key={stop.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                            Stop {stop.sequence + 1}
                          </p>
                          {isDirectProperty ? (
                            <Badge className="bg-[#d6f18b] text-[#0a1a10]">
                              Direct
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-2 font-medium text-black">
                          {customerName}
                        </p>
                        <p className="text-sm text-black/50">
                          {getPropertyDisplayAddress(prop)}
                        </p>
                        {prop?.latitude && prop?.longitude ? (
                          <p className="mt-1 text-xs text-black/30">
                            {prop.latitude.toFixed(4)},{" "}
                            {prop.longitude.toFixed(4)}
                          </p>
                        ) : null}
                      </div>
                      <Badge
                        className={
                          stop.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-black/8 text-black/60"
                        }
                      >
                        {stop.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-black/40">No stops added yet.</p>
          )}
        </div>
      )}
    </article>
  );
};

export const Route = createFileRoute("/admin/routes/")({
  component: AdminRoutesPage,
  loader: async () => ({
    contractors: await listContractors(),
    properties: await listProperties(),
    routes: await listRoutes(),
    workOrders: await listWorkOrders(),
  }),
});
