import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Home,
  MessageSquare,
} from "lucide-react";

import { getQuoteDetail } from "@/functions/get-quote-detail";
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
      <div className="min-h-full bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-black/8 bg-white p-10 text-center shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
          Quote not found.
        </div>
      </div>
    );
  }

  const statusMeta = getQuoteStatusMeta(quote.status);

  return (
    <div className="min-h-full bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-black/58 transition hover:text-black"
          to="/app/quotes"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all requests
        </Link>

        <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
                Request detail
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-black">
                {quote.serviceType}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-black/58">
                {statusMeta.description}
              </p>
            </div>
            <Badge className={statusMeta.badge}>{statusMeta.label}</Badge>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
            <div className="mb-5 flex items-center gap-3">
              <Home className="h-4 w-4 text-black/35" />
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
                Property
              </h2>
            </div>
            <p className="text-base font-medium text-black">
              {quote.property?.street}
            </p>
            <p className="mt-1 text-sm text-black/58">
              {quote.property?.city}, {quote.property?.state}{" "}
              {quote.property?.zip}
            </p>
            {quote.property?.nickname ? (
              <p className="mt-3 text-sm text-black/58">
                Nickname: {quote.property.nickname}
              </p>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
            <div className="mb-5 flex items-center gap-3">
              <CalendarClock className="h-4 w-4 text-black/35" />
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
                Visit timing
              </h2>
            </div>
            <div className="space-y-2 text-sm text-black/58">
              <p>
                Requested window:{" "}
                {formatQuoteWindow(
                  quote.preferredEndDate,
                  quote.preferredStartDate
                )}
              </p>
              <p>Preferred time: {formatVisitTime(quote.preferredVisitTime)}</p>
              <p>
                Scheduled visit: {formatScheduledVisit(quote.scheduledVisitAt)}
              </p>
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
            <div className="mb-5 flex items-center gap-3">
              <FileText className="h-4 w-4 text-black/35" />
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
                Quote summary
              </h2>
            </div>

            <div className="space-y-3 text-sm text-black/58">
              <p>
                Property size:{" "}
                {quote.propertySize ?? "To be confirmed during the visit"}
              </p>
              <p>
                Estimate:{" "}
                {quote.estimateLow != null && quote.estimateHigh != null
                  ? `${formatCents(quote.estimateLow)} - ${formatCents(quote.estimateHigh)}`
                  : "Pending site review"}
              </p>
              <p>
                Finalized:{" "}
                {quote.finalizedAt
                  ? quote.finalizedAt.toLocaleDateString()
                  : "Not finalized yet"}
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
            <div className="mb-5 flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-black/35" />
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
                Notes
              </h2>
            </div>
            <p className="text-sm leading-7 text-black/58">
              {quote.notes ?? "No additional notes were added to this request."}
            </p>
          </section>
        </div>

        <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
            Photos
          </h2>
          {quote.photos.length === 0 ? (
            <p className="mt-3 text-sm text-black/58">
              No photos were attached to this request.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quote.photos.map((photo) => (
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
    </div>
  );
};
