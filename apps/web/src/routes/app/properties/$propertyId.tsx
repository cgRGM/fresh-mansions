import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Calendar, Home, MapPin } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { getPropertyDetail } from "@/functions/get-property-detail";
import { getPropertyDisplayAddress } from "@/lib/address";
import { formatCents } from "@/lib/estimates";
import {
  formatQuoteWindow,
  formatServiceDate,
  getQuoteStatusMeta,
} from "@/lib/quotes";

export const Route = createFileRoute("/app/properties/$propertyId")({
  component: PropertyDetailPage,
  loader: ({ params }) =>
    getPropertyDetail({ data: { propertyId: params.propertyId } }),
});

const PropertyDetailPage = () => {
  const property = Route.useLoaderData();

  if (!property) {
    return (
      <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/45 transition hover:text-black"
            to="/app/properties"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to properties
          </Link>
          <div className="rounded-3xl border border-black/6 bg-white p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-black/50">Property not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5 stagger-children">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-black/45 transition hover:text-black"
          to="/app/properties"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>

        {/* Property header */}
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
              <Home className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Property
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
                {property.nickname ?? "Property"}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-black/50">
                <MapPin className="h-3.5 w-3.5" />
                {getPropertyDisplayAddress(property)}
              </div>
              {property.addressLine2 ? (
                <p className="mt-1 text-sm text-black/40">
                  {property.addressLine2}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Quotes for this property */}
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
            Quotes
          </h2>

          {!property.quotes || property.quotes.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                action={{
                  href: "/get-quote",
                  label: "Request an estimate",
                }}
                className="border-0 p-6 shadow-none"
                description="No quotes have been created for this property yet."
                illustration="leaf"
                title="No quotes yet"
              />
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {property.quotes.map((quote) => {
                const statusMeta = getQuoteStatusMeta(quote.status);

                return (
                  <Link
                    className="group flex items-center justify-between rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 transition-all hover:border-black/12 hover:shadow-sm"
                    key={quote.id}
                    params={{ quoteId: quote.id }}
                    to="/app/quotes/$quoteId"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold tracking-[-0.02em] text-black">
                        {quote.serviceType}
                      </span>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-black/40">
                        {quote.finalPrice != null ? (
                          <span className="font-medium text-emerald-700">
                            {formatCents(quote.finalPrice)}
                          </span>
                        ) : null}
                        {quote.preferredStartDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatQuoteWindow(
                              quote.preferredEndDate,
                              quote.preferredStartDate
                            )}
                          </span>
                        ) : null}
                        {quote.proposedWorkDate ? (
                          <span>Work date: {formatServiceDate(quote.proposedWorkDate)}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusMeta.badge}>
                        {statusMeta.label}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-black/20 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
