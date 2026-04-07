import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/empty-state";
import { AddressAutocomplete } from "@/components/quote/address-autocomplete";
import type { QuoteAddressSelection } from "@/components/quote/address-autocomplete";
import { RadarStaticMap } from "@/components/radar-static-map";
import type { StaticMapPath } from "@/components/radar-static-map";
import { addCustomerProperty } from "@/functions/admin/add-customer-property";
import { addPropertiesToRoute } from "@/functions/admin/add-properties-to-route";
import { addPropertyToRoute } from "@/functions/admin/add-property-to-route";
import { addRouteStop } from "@/functions/admin/add-route-stop";
import { createCustomerBackfill } from "@/functions/admin/create-customer-backfill";
import { createRouteRecord } from "@/functions/admin/create-route";
import { listContractors } from "@/functions/admin/list-contractors";
import { listCustomers } from "@/functions/admin/list-customers";
import { listProperties } from "@/functions/admin/list-properties";
import { listRoutes } from "@/functions/admin/list-routes";
import { listWorkOrders } from "@/functions/admin/list-work-orders";
import { optimizeRouteStops } from "@/functions/admin/optimize-route-stops";
import { reassignRoute } from "@/functions/admin/reassign-route";
import { reorderRouteStops } from "@/functions/admin/reorder-route-stops";
import { getPropertyDisplayAddress } from "@/lib/address";

const adminRoutesRouteApi = getRouteApi("/admin/routes/");
const browserDateInputSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const routeColorSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{6}$/, "Choose a valid route color");

type RouteRecord = Awaited<ReturnType<typeof listRoutes>>[number];
interface AdminRoutesLoaderData {
  contractors: Awaited<ReturnType<typeof listContractors>>;
  customers: Awaited<ReturnType<typeof listCustomers>>;
  properties: Awaited<ReturnType<typeof listProperties>>;
  routes: Awaited<ReturnType<typeof listRoutes>>;
  workOrders: Awaited<ReturnType<typeof listWorkOrders>>;
}

const ROUTE_COLORS = [
  "0x0a1a10",
  "0x2563eb",
  "0xdc2626",
  "0xd97706",
  "0x7c3aed",
  "0x0891b2",
  "0xdb2777",
  "0x059669",
] as const;

const [DEFAULT_ROUTE_COLOR] = ROUTE_COLORS;
const MAX_OPTIMIZABLE_STOPS = 10;

interface RouteMapMarker {
  color: string;
  latitude: number;
  longitude: number;
  routeId: string;
}

type RouteMapPath = StaticMapPath & { routeId: string };

const toRadarColor = (value: string): string => {
  if (/^0x[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return `0x${value.slice(1).toLowerCase()}`;
  }

  return DEFAULT_ROUTE_COLOR;
};

const toHexColor = (value: string): string =>
  `#${toRadarColor(value).slice(2)}`;

const resolveRouteColor = (route: RouteRecord, routeIndex: number): string =>
  toRadarColor(route.color ?? ROUTE_COLORS[routeIndex % ROUTE_COLORS.length]);

const getStopProperty = (stop: RouteRecord["stops"][number]) =>
  stop.property ?? stop.workOrder?.quote?.property ?? null;

const getStopCustomerName = (stop: RouteRecord["stops"][number]): string =>
  stop.property?.customer?.user?.name ??
  stop.workOrder?.quote?.customer?.user?.name ??
  "Unknown client";

const getStopStatusBadgeClass = (status: string): string => {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-black/8 text-black/60";
};

const StopDirectBadge = ({
  isDirectProperty,
}: {
  readonly isDirectProperty: boolean;
}) => {
  if (!isDirectProperty) {
    return null;
  }

  return <Badge className="bg-[#d6f18b] text-[#0a1a10]">Direct</Badge>;
};

const StopCoordinates = ({
  latitude,
  longitude,
}: {
  readonly latitude: null | number | undefined;
  readonly longitude: null | number | undefined;
}) => {
  if (typeof latitude !== "number") {
    return null;
  }

  if (typeof longitude !== "number") {
    return null;
  }

  return (
    <p className="mt-1 text-xs text-black/30">
      {latitude.toFixed(4)}, {longitude.toFixed(4)}
    </p>
  );
};

const RouteStopItem = ({
  canMoveDown,
  canMoveUp,
  onMoveDown,
  onMoveUp,
  stopIndex,
  stop,
}: {
  readonly canMoveDown: boolean;
  readonly canMoveUp: boolean;
  readonly onMoveDown: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onMoveUp: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly stopIndex: number;
  readonly stop: RouteRecord["stops"][number];
}) => {
  const property = getStopProperty(stop);
  const customerName = getStopCustomerName(stop);
  const isDirectProperty = Boolean(stop.propertyId && !stop.workOrderId);

  return (
    <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Stop {stop.sequence + 1}
            </p>
            <StopDirectBadge isDirectProperty={isDirectProperty} />
          </div>
          <p className="mt-2 font-medium text-black">{customerName}</p>
          <p className="text-sm text-black/50">
            {getPropertyDisplayAddress(property)}
          </p>
          <StopCoordinates
            latitude={property?.latitude}
            longitude={property?.longitude}
          />
        </div>

        <div className="flex items-start gap-2">
          <div className="grid gap-1">
            <Button
              className="h-7 rounded-lg px-2"
              data-stop-index={stopIndex}
              disabled={!canMoveUp}
              onClick={onMoveUp}
              size="sm"
              type="button"
              variant="outline"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              className="h-7 rounded-lg px-2"
              data-stop-index={stopIndex}
              disabled={!canMoveDown}
              onClick={onMoveDown}
              size="sm"
              type="button"
              variant="outline"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Badge className={getStopStatusBadgeClass(stop.status)}>
            {stop.status}
          </Badge>
        </div>
      </div>
    </div>
  );
};

interface RouteCardProps {
  readonly contractors: Awaited<ReturnType<typeof listContractors>>;
  readonly expanded: boolean;
  readonly onToggle: (routeId: string) => void;
  readonly route: RouteRecord;
  readonly routeColor: string;
}

const RouteColorSwatches = ({
  idPrefix,
  onSelect,
  value,
}: {
  readonly idPrefix: string;
  readonly onSelect: (color: string) => void;
  readonly value: string;
}) => {
  const handleColorClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onSelect(event.currentTarget.value);
    },
    [onSelect]
  );

  return (
    <div className="grid grid-cols-8 gap-2">
      {ROUTE_COLORS.map((color) => {
        const isSelected = toRadarColor(value) === color;

        return (
          <button
            aria-label={`Choose color ${color}`}
            className="h-8 w-8 rounded-full border border-black/10"
            id={`${idPrefix}-${color}`}
            key={color}
            onClick={handleColorClick}
            style={{
              backgroundColor: toHexColor(color),
              boxShadow: isSelected
                ? "0 0 0 2px rgba(0,0,0,0.9), 0 0 0 4px rgba(255,255,255,1)"
                : undefined,
            }}
            type="button"
            value={color}
          />
        );
      })}
    </div>
  );
};

const RouteCard = ({
  contractors,
  expanded,
  onToggle,
  route,
  routeColor,
}: RouteCardProps) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSavingReassignment, setIsSavingReassignment] = useState(false);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [reassignmentForm, setReassignmentForm] = useState({
    color: toRadarColor(routeColor),
    contractorId: route.contractorId ?? "",
    routeDate: route.routeDate,
  });

  const stopCoordinates = useMemo(
    () =>
      route.stops.flatMap((stop) => {
        const property = getStopProperty(stop);

        if (typeof property?.latitude !== "number") {
          return [];
        }

        if (typeof property.longitude !== "number") {
          return [];
        }

        return [
          {
            latitude: property.latitude,
            longitude: property.longitude,
          },
        ];
      }),
    [route.stops]
  );

  const stopMarkers: RouteMapMarker[] = useMemo(
    () =>
      stopCoordinates.map((coordinate) => ({
        ...coordinate,
        color: routeColor,
        routeId: route.id,
      })),
    [route.id, routeColor, stopCoordinates]
  );

  const stopPaths: RouteMapPath[] = useMemo(() => {
    if (stopCoordinates.length < 2) {
      return [];
    }

    return [
      {
        borderColor: "0xffffff",
        borderWidth: 2,
        color: routeColor,
        coordinates: stopCoordinates,
        routeId: route.id,
        width: 4,
      },
    ];
  }, [route.id, routeColor, stopCoordinates]);

  const canOptimize =
    route.stops.length >= 3 &&
    route.stops.length <= MAX_OPTIMIZABLE_STOPS &&
    stopCoordinates.length === route.stops.length;

  const handleCardToggle = useCallback(() => {
    onToggle(route.id);
  }, [onToggle, route.id]);

  const handleReassignmentChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;

      setReassignmentForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleReassignmentColorSelect = useCallback((color: string) => {
    setReassignmentForm((current) => ({
      ...current,
      color,
    }));
  }, []);

  const handleReassignmentSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (
        !browserDateInputSchema.safeParse(reassignmentForm.routeDate).success
      ) {
        toast.error("Choose a valid route date");
        return;
      }

      if (!routeColorSchema.safeParse(reassignmentForm.color).success) {
        toast.error("Choose a valid route color");
        return;
      }

      setIsSavingReassignment(true);

      try {
        await reassignRoute({
          data: {
            color: toRadarColor(reassignmentForm.color),
            contractorId: reassignmentForm.contractorId || undefined,
            routeDate: reassignmentForm.routeDate,
            routeId: route.id,
          },
        });
        toast.success("Route updated");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update route"
        );
      } finally {
        setIsSavingReassignment(false);
      }
    },
    [
      reassignmentForm.color,
      reassignmentForm.contractorId,
      reassignmentForm.routeDate,
      route.id,
    ]
  );

  const handleMoveStop = useCallback(
    async (stopIndex: number, direction: "down" | "up") => {
      const nextIndex = direction === "up" ? stopIndex - 1 : stopIndex + 1;

      if (nextIndex < 0 || nextIndex >= route.stops.length) {
        return;
      }

      const orderedStopIds = route.stops.map((stop) => stop.id);
      const currentStopId = orderedStopIds[stopIndex];
      const swapStopId = orderedStopIds[nextIndex];

      if (!currentStopId || !swapStopId) {
        return;
      }

      orderedStopIds[stopIndex] = swapStopId;
      orderedStopIds[nextIndex] = currentStopId;

      setIsSavingReorder(true);

      try {
        await reorderRouteStops({
          data: {
            routeId: route.id,
            stopIds: orderedStopIds,
          },
        });
        toast.success("Route stop order updated");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to reorder route stops"
        );
      } finally {
        setIsSavingReorder(false);
      }
    },
    [route.id, route.stops]
  );

  const handleOptimize = useCallback(async () => {
    setIsOptimizing(true);

    try {
      await optimizeRouteStops({
        data: {
          routeId: route.id,
        },
      });
      toast.success("Route stop order optimized");
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to optimize route"
      );
    } finally {
      setIsOptimizing(false);
    }
  }, [route.id]);

  const handleMoveDownClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const stopIndex = Number(event.currentTarget.dataset.stopIndex);

      if (!Number.isInteger(stopIndex)) {
        return;
      }

      handleMoveStop(stopIndex, "down");
    },
    [handleMoveStop]
  );

  const handleMoveUpClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const stopIndex = Number(event.currentTarget.dataset.stopIndex);

      if (!Number.isInteger(stopIndex)) {
        return;
      }

      handleMoveStop(stopIndex, "up");
    },
    [handleMoveStop]
  );

  return (
    <article className="rounded-3xl border border-black/6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <button
        className="flex w-full items-start justify-between gap-4 p-6 text-left"
        onClick={handleCardToggle}
        type="button"
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-1 h-4 w-4 flex-shrink-0 rounded-full"
            style={{
              backgroundColor: toHexColor(routeColor),
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

      {expanded ? (
        <div className="border-t border-black/6 p-6">
          <form
            className="mb-5 grid gap-3 rounded-2xl border border-black/8 bg-[#f9f8f5] p-4 md:grid-cols-2"
            onSubmit={handleReassignmentSubmit}
          >
            <div className="space-y-1">
              <Label htmlFor={`route-date-${route.id}`}>Route date</Label>
              <Input
                className="h-10 rounded-xl border-black/10 bg-white"
                id={`route-date-${route.id}`}
                name="routeDate"
                onChange={handleReassignmentChange}
                type="date"
                value={reassignmentForm.routeDate}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`route-contractor-${route.id}`}>Contractor</Label>
              <select
                className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm"
                id={`route-contractor-${route.id}`}
                name="contractorId"
                onChange={handleReassignmentChange}
                value={reassignmentForm.contractorId}
              >
                <option value="">Unassigned</option>
                {contractors.map((contractor) => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Route color</Label>
              <RouteColorSwatches
                idPrefix={`route-color-${route.id}`}
                onSelect={handleReassignmentColorSelect}
                value={reassignmentForm.color}
              />
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button
                className="h-10 rounded-full bg-black px-4 text-white hover:bg-black/90"
                disabled={isSavingReassignment}
                type="submit"
              >
                {isSavingReassignment ? "Saving..." : "Update route"}
              </Button>
              <Button
                className="h-10 rounded-full border-black/20"
                disabled={isOptimizing || isSavingReorder || !canOptimize}
                onClick={handleOptimize}
                type="button"
                variant="outline"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isOptimizing ? "Optimizing..." : "Optimize order"}
              </Button>
              {canOptimize ? null : (
                <p className="self-center text-xs text-black/40">
                  Optimization requires 3-{MAX_OPTIMIZABLE_STOPS} stops with
                  coordinates.
                </p>
              )}
            </div>
          </form>

          {stopMarkers.length > 0 ? (
            <div className="mb-5">
              <RadarStaticMap
                className="h-[250px]"
                height={250}
                mapStyle="radar-light-v1"
                markers={stopMarkers}
                paths={stopPaths}
                width={1000}
              />
            </div>
          ) : null}

          {route.stops.length > 0 ? (
            <div className="space-y-3">
              {route.stops.map((stop, index) => (
                <RouteStopItem
                  canMoveDown={
                    !isSavingReorder && index < route.stops.length - 1
                  }
                  canMoveUp={!isSavingReorder && index > 0}
                  key={stop.id}
                  onMoveDown={handleMoveDownClick}
                  onMoveUp={handleMoveUpClick}
                  stopIndex={index}
                  stop={stop}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/40">No stops added yet.</p>
          )}
        </div>
      ) : null}
    </article>
  );
};

const AdminRoutesPage = () => {
  const { contractors, customers, properties, routes, workOrders } =
    adminRoutesRouteApi.useLoaderData() as AdminRoutesLoaderData;
  const [batchPropertyForm, setBatchPropertyForm] = useState({
    propertyIds: [] as string[],
    routeId: "",
  });
  const [createCustomerAddressError, setCreateCustomerAddressError] =
    useState("");
  const [createCustomerForm, setCreateCustomerForm] = useState({
    addressLine2: "",
    email: "",
    name: "",
    nickname: "",
    phone: "",
    routeId: "",
  });
  const [createCustomerSelection, setCreateCustomerSelection] =
    useState<null | QuoteAddressSelection>(null);
  const [expandedRouteId, setExpandedRouteId] = useState<null | string>(null);
  const [existingAddressError, setExistingAddressError] = useState("");
  const [existingAddressForm, setExistingAddressForm] = useState({
    addressLine2: "",
    nickname: "",
  });
  const [existingAddressSelection, setExistingAddressSelection] =
    useState<null | QuoteAddressSelection>(null);
  const [existingCustomerForm, setExistingCustomerForm] = useState({
    customerId: "",
    propertyId: "",
    routeId: "",
  });
  const [inlineCustomerMode, setInlineCustomerMode] = useState<
    "create" | "existing"
  >("create");
  const [isSavingExistingAddress, setIsSavingExistingAddress] = useState(false);
  const [
    isSavingExistingPropertySelection,
    setIsSavingExistingPropertySelection,
  ] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [routeForm, setRouteForm] = useState<{
    color: string;
    contractorId: string;
    name: string;
    routeDate: string;
  }>({
    color: DEFAULT_ROUTE_COLOR,
    contractorId: "",
    name: "",
    routeDate: "",
  });
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>("all");
  const [stopForm, setStopForm] = useState({
    routeId: "",
    sequence: "0",
    workOrderId: "",
  });

  const handleSelectedRouteFilterChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setSelectedRouteFilter(event.target.value);
    },
    []
  );

  const assignableOrders = useMemo(
    () => workOrders.filter((order) => order.status !== "completed"),
    [workOrders]
  );

  const allMapMarkers = useMemo(() => {
    const markers: RouteMapMarker[] = [];

    for (const [routeIndex, route] of routes.entries()) {
      const color = resolveRouteColor(route, routeIndex);

      for (const stop of route.stops) {
        const property = getStopProperty(stop);

        if (typeof property?.latitude !== "number") {
          continue;
        }

        if (typeof property.longitude !== "number") {
          continue;
        }

        markers.push({
          color,
          latitude: property.latitude,
          longitude: property.longitude,
          routeId: route.id,
        });
      }
    }

    return markers;
  }, [routes]);

  const allMapPaths = useMemo(() => {
    const paths: RouteMapPath[] = [];

    for (const [routeIndex, route] of routes.entries()) {
      const coordinates = route.stops.flatMap((stop) => {
        const property = getStopProperty(stop);

        if (typeof property?.latitude !== "number") {
          return [];
        }

        if (typeof property.longitude !== "number") {
          return [];
        }

        return [
          {
            latitude: property.latitude,
            longitude: property.longitude,
          },
        ];
      });

      if (coordinates.length < 2) {
        continue;
      }

      paths.push({
        borderColor: "0xffffff",
        borderWidth: 2,
        color: resolveRouteColor(route, routeIndex),
        coordinates,
        routeId: route.id,
        width: 4,
      });
    }

    return paths;
  }, [routes]);

  const filteredMarkers = useMemo(
    () =>
      selectedRouteFilter === "all"
        ? allMapMarkers
        : allMapMarkers.filter(
            (marker) => marker.routeId === selectedRouteFilter
          ),
    [allMapMarkers, selectedRouteFilter]
  );

  const filteredPaths = useMemo(
    () =>
      selectedRouteFilter === "all"
        ? allMapPaths
        : allMapPaths.filter((path) => path.routeId === selectedRouteFilter),
    [allMapPaths, selectedRouteFilter]
  );

  const assignedPropertyIds = useMemo(() => {
    const ids = new Set<string>();

    for (const route of routes) {
      for (const stop of route.stops) {
        if (stop.propertyId) {
          ids.add(stop.propertyId);
        }

        const workOrderPropertyId = stop.workOrder?.quote?.property?.id;

        if (workOrderPropertyId) {
          ids.add(workOrderPropertyId);
        }
      }
    }

    return ids;
  }, [routes]);

  const unassignedProperties = useMemo(
    () =>
      properties.filter((property) => !assignedPropertyIds.has(property.id)),
    [assignedPropertyIds, properties]
  );

  const selectedExistingCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.id === existingCustomerForm.customerId
      ) ?? null,
    [customers, existingCustomerForm.customerId]
  );

  const existingCustomerProperties = useMemo(
    () => selectedExistingCustomer?.properties ?? [],
    [selectedExistingCustomer]
  );

  const handleRouteChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;

      setRouteForm((current) => ({ ...current, [name]: value }));
    },
    []
  );

  const handleCreateRouteColorSelect = useCallback((color: string) => {
    setRouteForm((current) => ({
      ...current,
      color,
    }));
  }, []);

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

      const normalizedRouteName = routeForm.name.trim();

      if (!normalizedRouteName) {
        toast.error("Route name is required");
        return;
      }

      if (!browserDateInputSchema.safeParse(routeForm.routeDate).success) {
        toast.error("Choose a route date before creating the route");
        return;
      }

      if (!routeColorSchema.safeParse(routeForm.color).success) {
        toast.error("Choose a valid route color");
        return;
      }

      try {
        await createRouteRecord({
          data: {
            color: toRadarColor(routeForm.color),
            contractorId: routeForm.contractorId || undefined,
            name: normalizedRouteName,
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

  const handleBatchRouteChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setBatchPropertyForm((current) => ({
        ...current,
        routeId: event.target.value,
      }));
    },
    []
  );

  const handleBatchPropertyChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const selectedIds = Array.from(
        event.target.selectedOptions,
        (option) => option.value
      );

      setBatchPropertyForm((current) => ({
        ...current,
        propertyIds: selectedIds,
      }));
    },
    []
  );

  const handleBatchPropertyAdd = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!batchPropertyForm.routeId) {
        toast.error("Choose a route first");
        return;
      }

      if (batchPropertyForm.propertyIds.length === 0) {
        toast.error("Select at least one property");
        return;
      }

      try {
        const result = await addPropertiesToRoute({
          data: {
            propertyIds: batchPropertyForm.propertyIds,
            routeId: batchPropertyForm.routeId,
          },
        });

        if (result.added === 0) {
          toast.message("No new properties were added");
        } else {
          toast.success(`${String(result.added)} properties added to route`);
        }

        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to add properties"
        );
      }
    },
    [batchPropertyForm.propertyIds, batchPropertyForm.routeId]
  );

  const handleCreateCustomerSelectionChange = useCallback(
    (selection: null | QuoteAddressSelection) => {
      setCreateCustomerSelection(selection);

      if (selection) {
        setCreateCustomerAddressError("");
      }
    },
    []
  );

  const handleCreateCustomerAddressLine2Change = useCallback(
    (value: string) => {
      setCreateCustomerForm((current) => ({
        ...current,
        addressLine2: value,
      }));
    },
    []
  );

  const handleCreateCustomerChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;

      setCreateCustomerForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleCreateCustomerAndOptionallyAdd = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!createCustomerSelection) {
        setCreateCustomerAddressError("Select a validated property address");
        toast.error("Select a validated property address");
        return;
      }

      setIsSavingCustomer(true);

      try {
        const result = await createCustomerBackfill({
          data: {
            ...createCustomerForm,
            city: createCustomerSelection.city,
            formattedAddress: createCustomerSelection.formattedAddress,
            fullAddress: createCustomerSelection.formattedAddress,
            latitude: createCustomerSelection.latitude,
            longitude: createCustomerSelection.longitude,
            radarMetadata: createCustomerSelection.radarMetadata,
            radarPlaceId: createCustomerSelection.radarPlaceId,
            state: createCustomerSelection.state,
            street: createCustomerSelection.street,
            validationStatus: "validated",
            zip: createCustomerSelection.zip,
          },
        });

        if (result.propertyId && createCustomerForm.routeId) {
          await addPropertyToRoute({
            data: {
              propertyId: result.propertyId,
              routeId: createCustomerForm.routeId,
            },
          });
        }

        toast.success(
          createCustomerForm.routeId
            ? "Client created and property added to route"
            : "Client created"
        );
        setCreateCustomerForm({
          addressLine2: "",
          email: "",
          name: "",
          nickname: "",
          phone: "",
          routeId: "",
        });
        setCreateCustomerSelection(null);
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create client"
        );
      } finally {
        setIsSavingCustomer(false);
      }
    },
    [createCustomerForm, createCustomerSelection]
  );

  const handleInlineCustomerMode = useCallback(
    (mode: "create" | "existing") => {
      setInlineCustomerMode(mode);
    },
    []
  );

  const handleCreateModeClick = useCallback(() => {
    handleInlineCustomerMode("create");
  }, [handleInlineCustomerMode]);

  const handleExistingModeClick = useCallback(() => {
    handleInlineCustomerMode("existing");
  }, [handleInlineCustomerMode]);

  const handleExistingCustomerChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = event.target;

      setExistingCustomerForm((current) => {
        if (name === "customerId") {
          return {
            customerId: value,
            propertyId: "",
            routeId: current.routeId,
          };
        }

        return {
          ...current,
          [name]: value,
        };
      });
    },
    []
  );

  const handleExistingAddressSelectionChange = useCallback(
    (selection: null | QuoteAddressSelection) => {
      setExistingAddressSelection(selection);

      if (selection) {
        setExistingAddressError("");
      }
    },
    []
  );

  const handleExistingAddressLine2Change = useCallback((value: string) => {
    setExistingAddressForm((current) => ({
      ...current,
      addressLine2: value,
    }));
  }, []);

  const handleExistingAddressInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setExistingAddressForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleAddExistingPropertyToRoute = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!existingCustomerForm.routeId) {
        toast.error("Choose a route first");
        return;
      }

      if (!existingCustomerForm.propertyId) {
        toast.error("Choose an existing address");
        return;
      }

      setIsSavingExistingPropertySelection(true);

      try {
        await addPropertyToRoute({
          data: {
            propertyId: existingCustomerForm.propertyId,
            routeId: existingCustomerForm.routeId,
          },
        });
        toast.success("Existing address added to route");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to add existing address to route"
        );
      } finally {
        setIsSavingExistingPropertySelection(false);
      }
    },
    [existingCustomerForm.propertyId, existingCustomerForm.routeId]
  );

  const handleCreateAddressForExistingCustomer = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!existingCustomerForm.customerId) {
        toast.error("Choose a customer first");
        return;
      }

      if (!existingAddressSelection) {
        setExistingAddressError("Select a validated property address");
        toast.error("Select a validated property address");
        return;
      }

      setIsSavingExistingAddress(true);

      try {
        const result = await addCustomerProperty({
          data: {
            addressLine2: existingAddressForm.addressLine2,
            city: existingAddressSelection.city,
            customerId: existingCustomerForm.customerId,
            formattedAddress: existingAddressSelection.formattedAddress,
            latitude: existingAddressSelection.latitude,
            longitude: existingAddressSelection.longitude,
            nickname: existingAddressForm.nickname,
            radarMetadata: existingAddressSelection.radarMetadata,
            radarPlaceId: existingAddressSelection.radarPlaceId,
            state: existingAddressSelection.state,
            street: existingAddressSelection.street,
            validationStatus: "validated",
            zip: existingAddressSelection.zip,
          },
        });

        if (existingCustomerForm.routeId) {
          await addPropertyToRoute({
            data: {
              propertyId: result.propertyId,
              routeId: existingCustomerForm.routeId,
            },
          });
        }

        toast.success(
          existingCustomerForm.routeId
            ? "Address created and added to route"
            : "Address created"
        );
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to add address"
        );
      } finally {
        setIsSavingExistingAddress(false);
      }
    },
    [
      existingAddressForm.addressLine2,
      existingAddressForm.nickname,
      existingAddressSelection,
      existingCustomerForm.customerId,
      existingCustomerForm.routeId,
    ]
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedRouteId((current) => (current === id ? null : id));
  }, []);

  return (
    <div className="stagger-children space-y-5">
      {filteredMarkers.length > 0 || filteredPaths.length > 0 ? (
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                  Route map
                </p>
                <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
                  Ordered stops and path geometry
                </h2>
              </div>
            </div>
            <select
              className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-sm"
              onChange={handleSelectedRouteFilterChange}
              value={selectedRouteFilter}
            >
              <option value="all">All routes</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name} ({route.routeDate})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            {routes.map((route, index) => {
              const routeColor = resolveRouteColor(route, index);

              return (
                <div className="flex items-center gap-1.5" key={route.id}>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: toHexColor(routeColor),
                    }}
                  />
                  <span className="text-xs font-medium text-black/50">
                    {route.name}
                  </span>
                </div>
              );
            })}
          </div>

          <RadarStaticMap
            className="h-[380px]"
            height={380}
            mapStyle="radar-light-v1"
            markers={filteredMarkers}
            paths={filteredPaths}
            width={1200}
          />
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-3">
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
                {contractors.map((contractor) => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Route color</Label>
              <RouteColorSwatches
                idPrefix="route-create-color"
                onSelect={handleCreateRouteColorSelect}
                value={routeForm.color}
              />
            </div>
            <Button
              className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
              type="submit"
            >
              Create route
            </Button>
          </div>
        </form>

        <form
          className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          onSubmit={handleBatchPropertyAdd}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d6f18b]/30 text-[#0a1a10]">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Direct assign
              </p>
              <h3 className="text-lg font-bold tracking-[-0.03em] text-black">
                Batch add properties
              </h3>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-black/40">
            Hold Command and click to select multiple properties.
          </p>
          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch-route-id">Route</Label>
              <select
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                id="batch-route-id"
                onChange={handleBatchRouteChange}
                value={batchPropertyForm.routeId}
              >
                <option value="">Choose route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.routeDate})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-property-ids">
                Properties ({unassignedProperties.length} unassigned)
              </Label>
              <select
                className="min-h-[170px] w-full rounded-2xl border border-black/10 bg-white p-2 text-sm"
                id="batch-property-ids"
                multiple
                onChange={handleBatchPropertyChange}
                value={batchPropertyForm.propertyIds}
              >
                {unassignedProperties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.customer?.user?.name ?? "Unknown"} -{" "}
                    {property.fullAddress}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="h-11 rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800"
              type="submit"
            >
              Add selected properties
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

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Inline customer
            </p>
            <h3 className="text-lg font-bold tracking-[-0.03em] text-black">
              Customer + address accordion
            </h3>
          </div>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <button
            className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#f9f8f5] px-4 py-3 text-left"
            onClick={handleCreateModeClick}
            type="button"
          >
            <span className="text-sm font-semibold text-black">
              Create customer + address
            </span>
            {inlineCustomerMode === "create" ? (
              <ChevronUp className="h-4 w-4 text-black/40" />
            ) : (
              <ChevronDown className="h-4 w-4 text-black/40" />
            )}
          </button>

          <button
            className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#f9f8f5] px-4 py-3 text-left"
            onClick={handleExistingModeClick}
            type="button"
          >
            <span className="text-sm font-semibold text-black">
              Select existing customer + address
            </span>
            {inlineCustomerMode === "existing" ? (
              <ChevronUp className="h-4 w-4 text-black/40" />
            ) : (
              <ChevronDown className="h-4 w-4 text-black/40" />
            )}
          </button>
        </div>

        {inlineCustomerMode === "create" ? (
          <form
            className="grid gap-4 lg:grid-cols-2"
            onSubmit={handleCreateCustomerAndOptionallyAdd}
          >
            {[
              ["name", "Full name", "Jordan Taylor"],
              ["email", "Email", "jordan@example.com"],
              ["phone", "Phone", "(555) 123-4567"],
              ["nickname", "Property nickname", "Main residence"],
            ].map(([field, label, placeholder]) => (
              <div className="space-y-2" key={field}>
                <Label htmlFor={`inline-create-${field}`}>{label}</Label>
                <Input
                  className="h-11 rounded-2xl border-black/10"
                  id={`inline-create-${field}`}
                  name={field}
                  onChange={handleCreateCustomerChange}
                  placeholder={placeholder}
                  value={
                    createCustomerForm[field as keyof typeof createCustomerForm]
                  }
                />
              </div>
            ))}

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="inline-create-route-id">
                Add property to route (optional)
              </Label>
              <select
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                id="inline-create-route-id"
                name="routeId"
                onChange={handleCreateCustomerChange}
                value={createCustomerForm.routeId}
              >
                <option value="">Do not assign yet</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.routeDate})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 lg:col-span-2">
              <AddressAutocomplete
                addressError={createCustomerAddressError}
                addressLine2={createCustomerForm.addressLine2}
                addressLine2Label="Address line 2"
                addressPlaceholder="Suite, gate code, or unit"
                label="Validated property address"
                onAddressLine2Change={handleCreateCustomerAddressLine2Change}
                onSelectionChange={handleCreateCustomerSelectionChange}
                placeholder="Search the service address"
                selectedAddress={createCustomerSelection}
              />
            </div>

            <div className="lg:col-span-2">
              <Button
                className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
                disabled={isSavingCustomer}
                type="submit"
              >
                {isSavingCustomer
                  ? "Creating client..."
                  : "Create client and optional stop"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <form
              className="grid gap-4 rounded-2xl border border-black/8 bg-[#f9f8f5] p-4"
              onSubmit={handleAddExistingPropertyToRoute}
            >
              <div className="space-y-2">
                <Label htmlFor="inline-existing-customer-id">Customer</Label>
                <select
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                  id="inline-existing-customer-id"
                  name="customerId"
                  onChange={handleExistingCustomerChange}
                  value={existingCustomerForm.customerId}
                >
                  <option value="">Choose customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.user?.name ?? "Unknown"} (
                      {customer.user?.email ?? "no email"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inline-existing-route-id">Route</Label>
                <select
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                  id="inline-existing-route-id"
                  name="routeId"
                  onChange={handleExistingCustomerChange}
                  value={existingCustomerForm.routeId}
                >
                  <option value="">Choose route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.routeDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inline-existing-property-id">
                  Existing address
                </Label>
                <select
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm"
                  id="inline-existing-property-id"
                  name="propertyId"
                  onChange={handleExistingCustomerChange}
                  value={existingCustomerForm.propertyId}
                >
                  <option value="">Choose existing address</option>
                  {existingCustomerProperties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {getPropertyDisplayAddress(property)}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
                disabled={isSavingExistingPropertySelection}
                type="submit"
              >
                {isSavingExistingPropertySelection
                  ? "Adding existing address..."
                  : "Add existing address to route"}
              </Button>
            </form>

            <form
              className="grid gap-4 rounded-2xl border border-black/8 bg-[#f9f8f5] p-4"
              onSubmit={handleCreateAddressForExistingCustomer}
            >
              <div className="space-y-2">
                <Label htmlFor="inline-existing-nickname">
                  New property nickname
                </Label>
                <Input
                  className="h-11 rounded-2xl border-black/10 bg-white"
                  id="inline-existing-nickname"
                  name="nickname"
                  onChange={handleExistingAddressInput}
                  placeholder="Main residence"
                  value={existingAddressForm.nickname}
                />
              </div>

              <AddressAutocomplete
                addressError={existingAddressError}
                addressLine2={existingAddressForm.addressLine2}
                addressLine2Label="Address line 2"
                addressPlaceholder="Suite, gate code, or unit"
                label="Validated property address"
                onAddressLine2Change={handleExistingAddressLine2Change}
                onSelectionChange={handleExistingAddressSelectionChange}
                placeholder="Search the service address"
                selectedAddress={existingAddressSelection}
              />

              <Button
                className="h-11 rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800"
                disabled={isSavingExistingAddress}
                type="submit"
              >
                {isSavingExistingAddress
                  ? "Creating address..."
                  : "Create address for selected customer"}
              </Button>
            </form>
          </div>
        )}
      </section>

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
              onToggle={toggleExpanded}
              route={route}
              routeColor={resolveRouteColor(route, routeIndex)}
            />
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
    customers: await listCustomers(),
    properties: await listProperties(),
    routes: await listRoutes(),
    workOrders: await listWorkOrders(),
  }),
});
