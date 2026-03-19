import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { convertToWorkOrder } from "@/functions/admin/convert-to-work-order";
import { finalizeQuote } from "@/functions/admin/finalize-quote";
import { getAdminQuoteDetail } from "@/functions/admin/get-quote-detail";
import { scheduleVisit } from "@/functions/admin/schedule-visit";
import { updateQuoteStatus } from "@/functions/admin/update-quote-status";
import { formatCents } from "@/lib/estimates";
import {
  formatQuoteWindow,
  formatVisitTime,
  getQuotePhotoUrl,
  getQuoteStatusMeta,
  normalizeQuoteStatus,
} from "@/lib/quotes";

const toDateTimeLocal = (value?: Date | null): string => {
  if (!value) {
    return "";
  }

  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export const Route = createFileRoute("/admin/quotes/$quoteId")({
  component: AdminQuoteDetailPage,
  loader: ({ params }) =>
    getAdminQuoteDetail({ data: { quoteId: params.quoteId } }),
});

const AdminQuoteDetailPage = () => {
  const quoteData = Route.useLoaderData();
  const router = useRouter();
  const [scheduledVisitAt, setScheduledVisitAt] = useState(
    toDateTimeLocal(quoteData?.scheduledVisitAt)
  );
  const [estimateLow, setEstimateLow] = useState(
    quoteData?.estimateLow != null ? String(quoteData.estimateLow / 100) : ""
  );
  const [estimateHigh, setEstimateHigh] = useState(
    quoteData?.estimateHigh != null ? String(quoteData.estimateHigh / 100) : ""
  );

  if (!quoteData) {
    return (
      <div className="rounded-[2rem] border border-black/8 bg-white p-12 text-center text-black/55">
        Quote not found.
      </div>
    );
  }

  const normalizedStatus = normalizeQuoteStatus(quoteData.status);
  const statusMeta = getQuoteStatusMeta(quoteData.status);

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    try {
      await updateQuoteStatus({ data: { quoteId: quoteData.id, status } });
      toast.success(`Quote marked ${status}`);
      await router.invalidate();
    } catch {
      toast.error("Failed to update quote status");
    }
  };

  const handleSchedule = async () => {
    if (!scheduledVisitAt) {
      toast.error("Choose the visit date and time first");
      return;
    }

    try {
      await scheduleVisit({
        data: {
          quoteId: quoteData.id,
          scheduledVisitAt: new Date(scheduledVisitAt).toISOString(),
        },
      });
      toast.success("Visit scheduled");
      await router.invalidate();
    } catch {
      toast.error("Failed to schedule the visit");
    }
  };

  const handleFinalize = async () => {
    const low = Math.round(Number(estimateLow) * 100);
    const high = Math.round(Number(estimateHigh) * 100);

    if (Number.isNaN(low) || Number.isNaN(high)) {
      toast.error("Enter both estimate values");
      return;
    }

    try {
      await finalizeQuote({
        data: {
          estimateHigh: high,
          estimateLow: low,
          quoteId: quoteData.id,
        },
      });
      toast.success("Quote finalized");
      await router.invalidate();
    } catch {
      toast.error("Failed to finalize the quote");
    }
  };

  const handleConvertToWorkOrder = async () => {
    try {
      await convertToWorkOrder({ data: { quoteId: quoteData.id } });
      toast.success("Work order created");
      await router.invalidate();
    } catch {
      toast.error("Failed to convert this quote");
    }
  };

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-black/58 transition hover:text-black"
        to="/admin/quotes"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to requests
      </Link>

      <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
              Request detail
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-black">
              {quoteData.serviceType}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-black/58">
              {statusMeta.description}
            </p>
          </div>
          <Badge className={statusMeta.badge}>{statusMeta.label}</Badge>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
            Customer and property
          </h2>
          <div className="mt-5 space-y-4 text-sm text-black/60">
            <div>
              <p className="font-medium text-black">
                {quoteData.customer?.user?.name ?? "Unknown customer"}
              </p>
              <p>{quoteData.customer?.user?.email ?? "No email"}</p>
              <p>{quoteData.customer?.phone ?? "No phone"}</p>
            </div>
            <div>
              <p className="font-medium text-black">
                {quoteData.property?.street ?? "No property address"}
              </p>
              <p>
                {quoteData.property?.city}, {quoteData.property?.state}{" "}
                {quoteData.property?.zip}
              </p>
              <p>Nickname: {quoteData.property?.nickname ?? "None"}</p>
            </div>
            <div>
              <p>
                Requested window:{" "}
                {formatQuoteWindow(
                  quoteData.preferredEndDate,
                  quoteData.preferredStartDate
                )}
              </p>
              <p>
                Preferred arrival:{" "}
                {formatVisitTime(quoteData.preferredVisitTime)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
            Operations
          </h2>

          <div className="mt-5 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="scheduledVisitAt">Schedule estimate visit</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="scheduledVisitAt"
                onChange={(event) => setScheduledVisitAt(event.target.value)}
                type="datetime-local"
                value={scheduledVisitAt}
              />
              <Button
                className="rounded-full bg-black text-white hover:bg-black/90"
                onClick={handleSchedule}
                type="button"
              >
                Save visit timing
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimateLow">Estimate low</Label>
                <Input
                  className="h-12 rounded-2xl border-black/10"
                  id="estimateLow"
                  onChange={(event) => setEstimateLow(event.target.value)}
                  step="0.01"
                  type="number"
                  value={estimateLow}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimateHigh">Estimate high</Label>
                <Input
                  className="h-12 rounded-2xl border-black/10"
                  id="estimateHigh"
                  onChange={(event) => setEstimateHigh(event.target.value)}
                  step="0.01"
                  type="number"
                  value={estimateHigh}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full bg-black text-white hover:bg-black/90"
                onClick={handleFinalize}
                type="button"
              >
                Finalize quote
              </Button>
              {normalizedStatus === "quote_ready" ? (
                <>
                  <Button
                    className="rounded-full bg-[#d6f18b] text-black hover:bg-[#c7e77b]"
                    onClick={() => handleStatusUpdate("approved")}
                    type="button"
                  >
                    Approve
                  </Button>
                  <Button
                    className="rounded-full"
                    onClick={() => handleStatusUpdate("rejected")}
                    type="button"
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </>
              ) : null}
              {normalizedStatus === "approved" ? (
                <Button
                  className="rounded-full bg-black text-white hover:bg-black/90"
                  onClick={handleConvertToWorkOrder}
                  type="button"
                >
                  Convert to work order
                </Button>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4 text-sm text-black/60">
              <p>
                Current estimate:{" "}
                {quoteData.estimateLow != null && quoteData.estimateHigh != null
                  ? `${formatCents(quoteData.estimateLow)} - ${formatCents(
                      quoteData.estimateHigh
                    )}`
                  : "Not finalized"}
              </p>
              <p className="mt-1">
                Work orders created: {quoteData.workOrders.length}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
        <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
          Notes
        </h2>
        <p className="mt-4 text-sm leading-7 text-black/60">
          {quoteData.notes ?? "No extra notes on this request."}
        </p>
      </section>

      <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
        <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
          Uploaded photos
        </h2>
        {quoteData.photos.length === 0 ? (
          <p className="mt-3 text-sm text-black/58">No photos uploaded.</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quoteData.photos.map((photo) => (
              <div
                className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-[#f6f4ef]"
                key={photo.id}
              >
                <img
                  alt={photo.filename ?? "Quote photo"}
                  className="h-48 w-full object-cover"
                  src={getQuotePhotoUrl(photo)}
                />
                <div className="px-4 py-3 text-sm text-black/58">
                  {photo.filename ?? "Uploaded photo"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
