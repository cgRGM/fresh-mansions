import { Badge } from "@fresh-mansions/ui/components/badge";
import { buttonVariants } from "@fresh-mansions/ui/components/button";
import { cn } from "@fresh-mansions/ui/lib/utils";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Plus } from "lucide-react";

import { getQuotes } from "@/functions/get-quotes";
import { formatCents } from "@/lib/estimates";
import {
  formatQuoteWindow,
  formatScheduledVisit,
  formatVisitTime,
  getQuoteStatusMeta,
} from "@/lib/quotes";

const quotesRouteApi = getRouteApi("/app/quotes/");

const QuotesListPage = () => {
  const { quotes } = quotesRouteApi.useLoaderData();

  return (
    <div className="min-h-full bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
              Quotes and requests
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-black">
              Every estimate request in one view
            </h1>
          </div>
          <Link
            className={cn(
              buttonVariants({
                className:
                  "h-12 rounded-full bg-black px-5 text-white hover:bg-black/90",
              })
            )}
            to="/get-quote"
          >
            Request another visit
            <Plus className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-black/12 bg-white p-12 text-center shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
            <FileText className="mx-auto h-12 w-12 text-black/22" />
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.05em] text-black">
              No requests yet
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-black/58">
              Start with a new estimate visit request and the quote history will
              build from there.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {quotes.map((quote) => {
              const statusMeta = getQuoteStatusMeta(quote.status);
              const hasEstimateRange =
                typeof quote.estimateLow === "number" &&
                typeof quote.estimateHigh === "number";

              return (
                <Link
                  className="block rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)] transition hover:border-black/16"
                  key={quote.id}
                  params={{ quoteId: quote.id }}
                  to="/app/quotes/$quoteId"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
                          {quote.serviceType}
                        </h2>
                        <Badge className={statusMeta.badge}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-black/58">
                        {quote.property?.street}, {quote.property?.city},{" "}
                        {quote.property?.state} {quote.property?.zip}
                      </p>
                      <div className="grid gap-2 text-sm text-black/58 sm:grid-cols-2">
                        <p>
                          Visit window:{" "}
                          {formatQuoteWindow(
                            quote.preferredEndDate,
                            quote.preferredStartDate
                          )}
                        </p>
                        <p>
                          Preferred time:{" "}
                          {formatVisitTime(quote.preferredVisitTime)}
                        </p>
                        <p>
                          Scheduled visit:{" "}
                          {formatScheduledVisit(quote.scheduledVisitAt)}
                        </p>
                        <p>
                          {hasEstimateRange
                            ? `Estimate: ${formatCents(quote.estimateLow)} - ${formatCents(
                                quote.estimateHigh
                              )}`
                            : "Estimate pending site review"}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-medium text-black/60">
                      Open detail
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/app/quotes/")({
  component: QuotesListPage,
  loader: () => getQuotes(),
});
