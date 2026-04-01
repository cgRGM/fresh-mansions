import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Camera,
  ClipboardList,
  MapPin,
  StickyNote,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getAdminQuoteDetail } from "@/functions/admin/get-quote-detail";
import { sendQuote } from "@/functions/admin/finalize-quote";
import { scheduleVisit } from "@/functions/admin/schedule-visit";
import { getPropertyDisplayAddress } from "@/lib/address";
import { formatCents } from "@/lib/estimates";
import {
  formatServiceDate,
  formatQuoteWindow,
  formatVisitTime,
  getQuotePhotoUrl,
  getQuoteStatusMeta,
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
  const [finalPrice, setFinalPrice] = useState(
    quoteData?.finalPrice != null ? String(quoteData.finalPrice / 100) : ""
  );
  const [proposedWorkDate, setProposedWorkDate] = useState(
    quoteData?.proposedWorkDate ?? ""
  );

  if (!quoteData) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center text-black/55 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        Quote not found.
      </div>
    );
  }

  const statusMeta = getQuoteStatusMeta(quoteData.status);

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

  const handleSendQuote = async () => {
    const parsedFinalPrice = Math.round(Number(finalPrice) * 100);

    if (Number.isNaN(parsedFinalPrice) || parsedFinalPrice <= 0) {
      toast.error("Enter the final quoted amount");
      return;
    }

    if (!proposedWorkDate) {
      toast.error("Choose the proposed work date");
      return;
    }

    try {
      await sendQuote({
        data: {
          finalPrice: parsedFinalPrice,
          proposedWorkDate,
          quoteId: quoteData.id,
        },
      });
      toast.success("Quote sent to customer");
      await router.invalidate();
    } catch {
      toast.error("Failed to send the quote");
    }
  };

  return (
    <div className="stagger-children space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-black/50 transition hover:text-black"
        to="/admin/quotes"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to requests
      </Link>

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Request detail
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
              {quoteData.serviceType}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">
              {statusMeta.description}
            </p>
          </div>
          <Badge className={statusMeta.badge}>{statusMeta.label}</Badge>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
              Customer and property
            </h2>
          </div>
          <div className="mt-5 space-y-4 text-sm text-black/55">
            <div>
              <p className="font-medium text-black">
                {quoteData.customer?.user?.name ?? "Unknown customer"}
              </p>
              <p>{quoteData.customer?.user?.email ?? "No email"}</p>
              <p>{quoteData.customer?.phone ?? "No phone"}</p>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-black/30" />
              <div>
                <p className="font-medium text-black">
                  {getPropertyDisplayAddress(quoteData.property)}
                </p>
                <p>Nickname: {quoteData.property?.nickname ?? "None"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 text-black/30" />
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
          </div>
        </section>

        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
              Operations
            </h2>
          </div>

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
                <Label htmlFor="finalPrice">Final quoted price</Label>
                <Input
                  className="h-12 rounded-2xl border-black/10"
                  id="finalPrice"
                  onChange={(event) => setFinalPrice(event.target.value)}
                  step="0.01"
                  type="number"
                  value={finalPrice}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposedWorkDate">Proposed work date</Label>
                <Input
                  className="h-12 rounded-2xl border-black/10"
                  id="proposedWorkDate"
                  onChange={(event) => setProposedWorkDate(event.target.value)}
                  type="date"
                  value={proposedWorkDate}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full bg-black text-white hover:bg-black/90"
                onClick={handleSendQuote}
                type="button"
              >
                Send fixed quote
              </Button>
            </div>

            <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 text-sm text-black/55">
              <p>
                Current quote:{" "}
                {quoteData.finalPrice != null
                  ? formatCents(quoteData.finalPrice)
                  : "Not sent yet"}
              </p>
              <p className="mt-1">
                Proposed work date: {formatServiceDate(quoteData.proposedWorkDate)}
              </p>
              <p className="mt-1">
                Customer status: {statusMeta.label}
              </p>
              <p className="mt-1">
                Work orders created: {quoteData.workOrders.length}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <StickyNote className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
            Notes
          </h2>
        </div>
        <p className="mt-4 text-sm leading-7 text-black/55">
          {quoteData.notes ?? "No extra notes on this request."}
        </p>
      </section>

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Camera className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
            Uploaded photos
          </h2>
        </div>
        {quoteData.photos.length === 0 ? (
          <p className="mt-3 text-sm text-black/50">No photos uploaded.</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quoteData.photos.map((photo) => (
              <div
                className="overflow-hidden rounded-2xl border border-black/6 bg-[#f9f8f5]"
                key={photo.id}
              >
                <img
                  alt={photo.filename ?? "Quote photo"}
                  className="h-48 w-full object-cover"
                  src={getQuotePhotoUrl(photo)}
                />
                <div className="px-4 py-3 text-sm text-black/50">
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
