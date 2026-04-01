import { Badge } from "@fresh-mansions/ui/components/badge";
import { buttonVariants } from "@fresh-mansions/ui/components/button";
import { cn } from "@fresh-mansions/ui/lib/utils";
import {
  createFileRoute,
  getRouteApi,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import * as zod from "zod";

import { EmptyState } from "@/components/empty-state";
import { CustomerRequestSheet } from "@/components/quote/customer-request-sheet";
import { getQuotes } from "@/functions/get-quotes";
import { getPropertyDisplayAddress } from "@/lib/address";
import { formatCents } from "@/lib/estimates";
import {
  formatQuoteWindow,
  formatScheduledVisit,
  formatServiceDate,
  formatVisitTime,
  getQuoteStatusMeta,
} from "@/lib/quotes";

const quotesRouteApi = getRouteApi("/app/quotes/");
const quotesSearchSchema = zod.object({
  newRequest: zod.string().optional(),
  propertyId: zod.string().optional(),
});

const QuotesListPage = () => {
  const navigate = useNavigate({ from: "/app/quotes/" });
  const { properties, quotes } = quotesRouteApi.useLoaderData();
  const search = quotesRouteApi.useSearch();
  const [isRequestSheetOpen, setIsRequestSheetOpen] = useState(
    search.newRequest === "1"
  );

  useEffect(() => {
    setIsRequestSheetOpen(search.newRequest === "1");
  }, [search.newRequest]);

  const handleRequestSheetChange = useCallback(
    (open: boolean) => {
      setIsRequestSheetOpen(open);
      navigate({
        replace: true,
        search: (current) => ({
          ...current,
          newRequest: open ? "1" : undefined,
          propertyId: open ? current.propertyId : undefined,
        }),
      });
    },
    [navigate]
  );
  const openRequestSheet = useCallback(() => {
    handleRequestSheetChange(true);
  }, [handleRequestSheetChange]);

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <CustomerRequestSheet
        initialPropertyId={search.propertyId}
        onOpenChange={handleRequestSheetChange}
        open={isRequestSheetOpen}
        properties={properties}
      />

      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Quotes & requests
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
              Your estimate requests
            </h1>
          </div>
          <button
            className={cn(
              buttonVariants({
                className:
                  "h-11 rounded-full bg-[#0a1a10] px-5 text-sm text-white hover:bg-[#0a1a10]/90",
              })
            )}
            onClick={openRequestSheet}
            type="button"
          >
            New request
            <Plus className="ml-2 h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {quotes.length === 0 ? (
          <EmptyState
            action={{
              href: "/app/quotes?newRequest=1",
              label: "Request your first service",
            }}
            description="Use a saved property or add a new address without leaving your dashboard flow."
            illustration="leaf"
            title="No requests yet"
          />
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => {
              const statusMeta = getQuoteStatusMeta(quote.status);

              return (
                <Link
                  className="group block rounded-3xl border border-black/6 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:border-black/12 hover:shadow-md sm:p-6"
                  key={quote.id}
                  params={{ quoteId: quote.id }}
                  to="/app/quotes/$quoteId"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
                          {quote.serviceType}
                        </h2>
                        <Badge className={statusMeta.badge}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-black/50">
                        {getPropertyDisplayAddress(quote.property)}
                      </p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-black/40">
                        <span>
                          Window:{" "}
                          {formatQuoteWindow(
                            quote.preferredEndDate,
                            quote.preferredStartDate
                          )}
                        </span>
                        <span>
                          Time: {formatVisitTime(quote.preferredVisitTime)}
                        </span>
                        <span>
                          Visit: {formatScheduledVisit(quote.scheduledVisitAt)}
                        </span>
                        <span>
                          {typeof quote.finalPrice === "number"
                            ? `Quote: ${formatCents(quote.finalPrice)}`
                            : "Quote pending"}
                        </span>
                        <span>
                          Work date: {formatServiceDate(quote.proposedWorkDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-medium text-black/35 transition-colors group-hover:text-black/70">
                      View details
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
  validateSearch: quotesSearchSchema,
});
