import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button, buttonVariants } from "@fresh-mansions/ui/components/button";
import { cn } from "@fresh-mansions/ui/lib/utils";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  Camera,
  FileText,
  Home,
  Plus,
  Sparkles,
} from "lucide-react";
import * as zod from "zod";

import { getDashboard } from "@/functions/get-dashboard";
import { getPropertyDisplayAddress } from "@/lib/address";
import { formatCents } from "@/lib/estimates";
import {
  formatQuoteWindow,
  formatScheduledVisit,
  formatVisitTime,
  getQuoteStatusMeta,
  normalizeQuoteStatus,
} from "@/lib/quotes";

const dashboardSearchSchema = zod.object({
  quoteId: zod.string().optional(),
});

const dashboardRouteApi = getRouteApi("/app/dashboard");

const DashboardPage = () => {
  const { user: session } = dashboardRouteApi.useRouteContext();
  const { invoices, orders, properties, quotes, subscriptions } =
    dashboardRouteApi.useLoaderData();
  const search = dashboardRouteApi.useSearch();
  const pendingRequests = quotes.filter((quote) =>
    ["requested", "visit_scheduled"].includes(
      normalizeQuoteStatus(quote.status)
    )
  );
  const finalizedQuotes = quotes.filter((quote) =>
    ["approved", "converted", "quote_ready"].includes(
      normalizeQuoteStatus(quote.status)
    )
  );
  const highlightedQuote = search.quoteId
    ? quotes.find((quote) => quote.id === search.quoteId)
    : null;

  return (
    <div className="min-h-full bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {highlightedQuote ? (
          <section className="rounded-[2rem] border border-black/8 bg-black p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/45">
                  Request received
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.06em]">
                  Your estimate visit request is now in review.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/64">
                  We have your requested window, preferred time, property
                  details, and uploaded notes. The operations team will confirm
                  the visit before posting the final quote.
                </p>
              </div>
              <Link
                params={{ quoteId: highlightedQuote.id }}
                to="/app/quotes/$quoteId"
              >
                <Button className="h-12 rounded-full bg-white px-5 text-black hover:bg-white/90">
                  Open request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
              Dashboard
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-black">
              {session?.user?.name ?? "Client"} overview
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-black/60">
              Track estimate requests, review finalized quotes, and keep every
              property organized without chasing email threads.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Pending requests",
                  value: String(pendingRequests.length),
                },
                {
                  label: "Saved properties",
                  value: String(properties.length),
                },
                {
                  label: "Quotes ready or approved",
                  value: String(finalizedQuotes.length),
                },
                {
                  label: "Active plans",
                  value: String(
                    subscriptions.filter(
                      (subscription) => subscription.status === "active"
                    ).length
                  ),
                },
              ].map((item) => (
                <div
                  className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4"
                  key={item.label}
                >
                  <p className="text-sm text-black/52">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-black">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-black/8 bg-black p-6 text-white shadow-[0_20px_80px_rgba(0,0,0,0.16)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/45">
              Quick actions
            </p>
            <div className="mt-6 space-y-3">
              <Link className="block" to="/get-quote">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10">
                  <div className="flex items-center gap-3">
                    <Plus className="h-4 w-4 text-[#d6f18b]" />
                    <span className="font-medium">
                      Request another estimate visit
                    </span>
                  </div>
                </div>
              </Link>
              <Link className="block" to="/app/properties">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10">
                  <div className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-[#d6f18b]" />
                    <span className="font-medium">Review saved properties</span>
                  </div>
                </div>
              </Link>
              <Link className="block" to="/app/quotes">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-[#d6f18b]" />
                    <span className="font-medium">See every quote request</span>
                  </div>
                </div>
              </Link>
            </div>
          </aside>
        </section>

        {quotes.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-black/12 bg-white p-8 text-center shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
            <Sparkles className="mx-auto h-10 w-10 text-[#79a63b]" />
            <h3 className="mt-6 text-2xl font-semibold tracking-[-0.05em] text-black">
              No requests or properties yet.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-black/58">
              This account is ready, but nothing has been submitted yet. Start
              with the estimate visit flow and the dashboard will populate from
              there.
            </p>
            <Link
              className={cn(
                buttonVariants({
                  className:
                    "mt-6 h-12 rounded-full bg-black px-5 text-white hover:bg-black/90",
                })
              )}
              to="/get-quote"
            >
              Start the estimate request
            </Link>
          </section>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
                      Pending estimate visits
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-black">
                      Requests in motion
                    </h3>
                  </div>
                  <CalendarClock className="h-5 w-5 text-black/35" />
                </div>

                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-5 text-sm text-black/55">
                      No visit requests are currently waiting on review.
                    </div>
                  ) : (
                    pendingRequests.map((quote) => {
                      const statusMeta = getQuoteStatusMeta(quote.status);

                      return (
                        <Link
                          className="block rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4 transition hover:border-black/16"
                          key={quote.id}
                          params={{ quoteId: quote.id }}
                          to="/app/quotes/$quoteId"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold tracking-[-0.04em] text-black">
                                {quote.property?.nickname ?? quote.serviceType}
                              </p>
                              <p className="mt-1 text-sm text-black/58">
                                {getPropertyDisplayAddress(quote.property)}
                              </p>
                              <p className="mt-3 text-sm text-black/58">
                                Window:{" "}
                                {formatQuoteWindow(
                                  quote.preferredEndDate,
                                  quote.preferredStartDate
                                )}
                              </p>
                              <p className="text-sm text-black/58">
                                Preferred time:{" "}
                                {formatVisitTime(quote.preferredVisitTime)}
                              </p>
                              {quote.scheduledVisitAt ? (
                                <p className="text-sm text-black/58">
                                  Scheduled visit:{" "}
                                  {formatScheduledVisit(quote.scheduledVisitAt)}
                                </p>
                              ) : null}
                            </div>
                            <Badge className={statusMeta.badge}>
                              {statusMeta.label}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
                      Finalized quotes
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-black">
                      Ready for review
                    </h3>
                  </div>
                  <Camera className="h-5 w-5 text-black/35" />
                </div>

                <div className="space-y-3">
                  {finalizedQuotes.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-5 text-sm text-black/55">
                      No finalized quotes yet. We’ll post pricing here after the
                      property visit is complete.
                    </div>
                  ) : (
                    finalizedQuotes.map((quote) => {
                      const statusMeta = getQuoteStatusMeta(quote.status);
                      const hasEstimateRange =
                        typeof quote.estimateLow === "number" &&
                        typeof quote.estimateHigh === "number";

                      return (
                        <Link
                          className="block rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4 transition hover:border-black/16"
                          key={quote.id}
                          params={{ quoteId: quote.id }}
                          to="/app/quotes/$quoteId"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold tracking-[-0.04em] text-black">
                                {quote.serviceType}
                              </p>
                              <p className="mt-1 text-sm text-black/58">
                                {getPropertyDisplayAddress(quote.property)}
                              </p>
                              {hasEstimateRange ? (
                                <p className="mt-3 text-sm font-medium text-black">
                                  {formatCents(quote.estimateLow)} -{" "}
                                  {formatCents(quote.estimateHigh)}
                                </p>
                              ) : null}
                            </div>
                            <Badge className={statusMeta.badge}>
                              {statusMeta.label}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
                    Saved properties
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-black">
                    Addresses on file
                  </h3>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <Link
                    className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4 transition hover:border-black/16"
                    key={property.id}
                    params={{ propertyId: property.id }}
                    to="/app/properties/$propertyId"
                  >
                    <p className="text-lg font-semibold tracking-[-0.04em] text-black">
                      {property.nickname ?? "Property"}
                    </p>
                    <p className="mt-2 text-sm text-black/58">
                      {getPropertyDisplayAddress(property)}
                    </p>
                    <p className="text-sm text-black/58">
                      {property.city}, {property.state} {property.zip}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
                    Billing and work
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-black">
                    Recurring plans and active orders
                  </h3>
                </div>
                <FileText className="h-5 w-5 text-black/35" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4">
                  <p className="text-sm text-black/52">Open invoices</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-black">
                    {
                      invoices.filter((invoice) =>
                        ["draft", "open"].includes(invoice.status)
                      ).length
                    }
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4">
                  <p className="text-sm text-black/52">Active work orders</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-black">
                    {
                      orders.filter((order) => order.status !== "completed")
                        .length
                    }
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
  loader: () => getDashboard(),
  validateSearch: dashboardSearchSchema,
});
