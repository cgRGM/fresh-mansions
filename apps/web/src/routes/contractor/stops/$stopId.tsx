import { Button } from "@fresh-mansions/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

import { completeStop } from "@/functions/contractor/complete-stop";
import { getStopDetail } from "@/functions/contractor/get-stop-detail";
import { getPropertyDisplayAddress } from "@/lib/address";

export const Route = createFileRoute("/contractor/stops/$stopId")({
  component: StopDetail,
  loader: ({ params }) => getStopDetail({ data: { stopId: params.stopId } }),
});

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
      window.location.href = "/contractor";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete stop"
      );
    }
  }, [stop]);

  if (!stop) {
    return (
      <div className="rounded-[1.75rem] border border-black/8 bg-white p-6 text-black/60">
        Stop not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-black/8 bg-white p-6">
        <p className="text-sm text-black/50">Customer</p>
        <p className="mt-1 text-2xl font-semibold text-black">
          {stop.workOrder?.quote?.customer?.user?.name ?? "Unknown"}
        </p>
        <p className="mt-4 text-sm text-black/50">Property</p>
        <p className="text-lg font-medium text-black">
          {getPropertyDisplayAddress(stop.workOrder?.quote?.property)}
        </p>
      </div>
      <Button className="w-full gap-2" onClick={handleComplete}>
        <CheckCircle className="h-4 w-4" />
        Mark Complete
      </Button>
    </div>
  );
}
