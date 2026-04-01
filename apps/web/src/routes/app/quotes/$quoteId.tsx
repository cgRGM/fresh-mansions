import { Badge } from "@fresh-mansions/ui/components/badge";
import { cn } from "@fresh-mansions/ui/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  FileText,
  Home,
  MessageSquare,
} from "lucide-react";

import { getQuoteDetail } from "@/functions/get-quote-detail";
import { getPropertyDisplayAddress } from "@/lib/address";
import { formatCents } from "@/lib/estimates";
import {
  formatQuoteWindow,
  formatScheduledVisit,
  formatVisitTime,
  getQuotePhotoUrl,
  getQuoteStatusMeta,
} from "@/lib/quotes";

export const Route = createFileRoute("/app/quotes/$quoteId")({
  component: QuoteDetailPage,
  loader: ({ params }) => getQuoteDetail({ data: { quoteId: params.quoteId } }),
});

const QuoteDetailPage = () => {
  const quote = Route.useLoaderData();

  if (!quote) {
    return (
      <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/45 transition hover:text-black"
            to="/app/quotes"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quotes
          </Link>
          <div className="rounded-3xl border border-black/6 bg-white p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-black/50">Quote not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = getQuoteStatusMeta(quote.status);

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5 stagger-children">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-black/45 transition hover:text-black"
          to="/app/quotes"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all requests
        </Link>

        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Request detail
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
                {quote.serviceType}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/50">
                {statusMeta.description}
              </p>
            </div>
            <Badge className={cn("shrink-0", statusMeta.badge)}>
              {statusMeta.label}
            </Badge>
          </div>
        </section>

        {/* Property + Timing */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
                <Home className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
                Property
              </h2>
            </div>
            <p className="font-medium text-black">
              {getPropertyDisplayAddress(quote.property)}
            </p>
            {quote.property?.nickname ? (
              <p className="mt-2 text-sm text-black/45">
                Nickname: {quote.property.nickname}
              </p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
                <CalendarClock className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
                Visit timing
              </h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black/45">Requested window</span>
                <span className="font-medium text-black">
                  {formatQuoteWindow(
                    quote.preferredEndDate,
                    quote.preferredStartDate
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/45">Preferred time</span>
                <span className="font-medium text-black">
                  {formatVisitTime(quote.preferredVisitTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/45">Scheduled visit</span>
                <span className="font-medium text-black">
                  {formatScheduledVisit(quote.scheduledVisitAt)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Quote summary + Notes */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
                Quote summary
              </h2>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black/45">Property size</span>
                <span className="font-medium text-black">
                  {quote.propertySize ?? "To be confirmed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/45">Estimate</span>
                <span className="font-medium text-black">
                  {quote.estimateLow != null && quote.estimateHigh != null
                    ? `${formatCents(quote.estimateLow)} – ${formatCents(quote.estimateHigh)}`
                    : "Pending site review"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/45">Finalized</span>
                <span className="font-medium text-black">
                  {quote.finalizedAt
                    ? quote.finalizedAt.toLocaleDateString()
                    : "Not yet"}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50">
                <MessageSquare className="h-4 w-4 text-violet-600" />
              </div>
              <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
                Notes
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-black/55">
              {quote.notes ?? "No additional notes were added to this request."}
            </p>
          </section>
        </div>

        {/* Photos */}
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50">
              <Camera className="h-4 w-4 text-rose-600" />
            </div>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
              Photos
            </h2>
          </div>
          {quote.photos.length === 0 ? (
            <p className="text-sm text-black/45">
              No photos were attached to this request.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quote.photos.map((photo) => (
                <div
                  className="group overflow-hidden rounded-2xl border border-black/6 bg-[#f9f8f5]"
                  key={photo.id}
                >
                  <img
                    alt={photo.filename ?? "Quote photo"}
                    className="h-44 w-full object-cover transition-transform group-hover:scale-[1.02]"
                    src={getQuotePhotoUrl(photo)}
                  />
                  <div className="px-4 py-2.5 text-xs font-medium text-black/50">
                    {photo.filename ?? "Uploaded photo"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
