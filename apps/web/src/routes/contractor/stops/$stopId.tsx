import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, MapPin, User, Wrench } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

import { completeStop } from "@/functions/contractor/complete-stop";
import { getStopDetail } from "@/functions/contractor/get-stop-detail";
import { getPropertyDisplayAddress } from "@/lib/address";

export const Route = createFileRoute("/contractor/stops/$stopId")({
  component: StopDetail,
  loader: ({ params }) => getStopDetail({ data: { stopId: params.stopId } }),
});

const statusColors: Record<string, string> = {
  arrived: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  en_route: "bg-amber-100 text-amber-700",
  pending: "bg-black/8 text-black/60",
  skipped: "bg-red-100 text-red-700",
};

function StopDetail() {
  const stop = Route.useLoaderData();

  const handleComplete = useCallback(async () => {
    if (!stop) {
      return;
    }

    try {
      await completeStop({
        data: {
          stopId: stop.id,
        },
      });
      toast.success("Stop completed");
      window.location.href = "/contractor/dashboard";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete stop"
      );
    }
  }, [stop]);

  if (!stop) {
    return (
      <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-fade-in-up rounded-3xl border border-dashed border-black/10 bg-white p-10 text-center shadow-[0_16px_50px_rgba(0,0,0,0.04)]">
            <h3 className="text-2xl font-semibold tracking-[-0.05em] text-black">
              Stop not found
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-black/55">
              This stop may have been removed or reassigned.
            </p>
            <Link
              className="mt-6 inline-flex h-12 items-center rounded-full bg-black px-6 text-sm font-medium text-white transition hover:bg-black/90"
              to="/contractor/dashboard"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const customerName =
    stop.workOrder?.quote?.customer?.user?.name ?? "Unknown client";
  const address = getPropertyDisplayAddress(stop.workOrder?.quote?.property);
  const serviceType = stop.workOrder?.quote?.serviceType;
  const isCompleted = stop.status === "completed";

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        {/* Back link */}
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-black/40 transition hover:text-black"
          to="/contractor/dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* Stop hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1a10] via-[#132b1a] to-[#0f0f0f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_oklch(0.6_0.15_140_/_0.12),_transparent_60%)]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                Stop {stop.sequence + 1}
              </span>
              <Badge
                className={statusColors[stop.status] ?? statusColors.pending}
              >
                {stop.status}
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
              {customerName}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
              <MapPin className="h-3.5 w-3.5" />
              {address}
            </div>
          </div>
        </section>

        {/* Details cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <User className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-black/40">Customer</p>
                <p className="text-sm font-semibold text-black">
                  {customerName}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-black/40">Property</p>
                <p className="text-sm font-semibold text-black">{address}</p>
              </div>
            </div>
          </section>

          {serviceType ? (
            <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                  <Wrench className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-black/40">Service</p>
                  <p className="text-sm font-semibold text-black">
                    {serviceType}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {stop.notes ? (
            <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-medium text-black/40">Notes</p>
              <p className="mt-1 text-sm leading-relaxed text-black/70">
                {stop.notes}
              </p>
            </section>
          ) : null}
        </div>

        {/* Photos */}
        {stop.workOrder?.quote?.photos &&
        stop.workOrder.quote.photos.length > 0 ? (
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Property photos
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stop.workOrder.quote.photos.map((photo) => (
                <img
                  alt={photo.filename ?? "Property photo"}
                  className="aspect-video w-full rounded-2xl border border-black/8 object-cover"
                  key={photo.id}
                  src={photo.url}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Action */}
        {!isCompleted ? (
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <Button
              className="w-full gap-2 sm:w-auto"
              onClick={handleComplete}
              size="lg"
            >
              <CheckCircle className="h-4 w-4" />
              Mark Complete
            </Button>
          </section>
        ) : (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="font-semibold text-emerald-700">
                This stop has been completed
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
