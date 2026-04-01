import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  FileText,
  Home,
  MapPin,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import * as zod from "zod";

import { EmptyState } from "@/components/empty-state";
import { getDashboard } from "@/functions/get-dashboard";
import { getPropertyDisplayAddress } from "@/lib/address";
import { formatCents } from "@/lib/estimates";
import {
  formatQuoteWindow,
  formatScheduledVisit,
  formatServiceDate,
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
  const quotesReadyForReview = quotes.filter(
    (quote) => normalizeQuoteStatus(quote.status) === "quote_sent"
  );
  const highlightedQuote = search.quoteId
    ? quotes.find((quote) => quote.id === search.quoteId)
    : null;

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        {/* Highlighted quote banner */}
        {highlightedQuote ? (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1a10] via-[#132b1a] to-[#0f0f0f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_oklch(0.6_0.15_140_/_0.12),_transparent_60%)]" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#d6f18b]/15 px-3 py-1 text-xs font-semibold text-[#d6f18b]">
                  <Sparkles className="h-3 w-3" />
                  Request received
                </div>
                <h1 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
                  Your service request is moving forward
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-white/60">
                  We have your requested window, preferred time, property
                  details, and uploaded notes. The team will schedule the visit,
                  confirm the final price, and send over a work date for you to
                  approve.
                </p>
              </div>
              <Link
                params={{ quoteId: highlightedQuote.id }}
                to="/app/quotes/$quoteId"
              >
                <div className="inline-flex h-11 items-center gap-2 rounded-full bg-[#d6f18b] px-5 text-sm font-semibold text-[#0a1a10] transition hover:bg-[#e2f5a0]">
                  Open request
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            </div>
          </section>
        ) : null}

        {/* Hero section + Quick actions */}
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Dashboard
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-black sm:text-4xl">
              Welcome back, {firstName}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/50">
              Track new requests, review fixed quotes, and keep every property
              organized in one place.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: ClipboardList,
                  label: "Pending",
                  value: String(pendingRequests.length),
                },
                {
                  icon: Home,
                  label: "Properties",
                  value: String(properties.length),
                },
                {
                  icon: TrendingUp,
                  label: "Awaiting reply",
                  value: String(quotesReadyForReview.length),
                },
                {
                  icon: FileText,
                  label: "Active plans",
                  value: String(
                    subscriptions.filter(
                      (subscription) => subscription.status === "active"
                    ).length
                  ),
                },
              ].map((item) => (
                <div
                  className="group rounded-2xl border border-black/5 bg-[#f4f2ec]/60 p-4 transition-colors hover:bg-[#f4f2ec]"
                  key={item.label}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5 text-black/30" />
                    <p className="text-xs font-medium text-black/45">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1a10] to-[#141414] p-6 text-white shadow-[0_16px_50px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,_oklch(0.6_0.15_140_/_0.08),_transparent_50%)]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                Quick actions
              </p>
              <div className="mt-5 space-y-2.5">
                <Link className="block" to="/get-quote">
                  <div className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3.5 transition-all hover:border-[#d6f18b]/20 hover:bg-[#d6f18b]/8">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d6f18b]/15">
                      <Plus className="h-4 w-4 text-[#d6f18b]" />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-white">
                      Request a new estimate
                    </span>
                    <ArrowRight className="ml-auto h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-[#d6f18b]" />
                  </div>
                </Link>
                <Link className="block" to="/app/properties">
                  <div className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3.5 transition-all hover:border-white/15 hover:bg-white/8">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8">
                      <Home className="h-4 w-4 text-white/60" />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-white">
                      Review saved properties
                    </span>
                    <ArrowRight className="ml-auto h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
                  </div>
                </Link>
                <Link className="block" to="/app/quotes">
                  <div className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3.5 transition-all hover:border-white/15 hover:bg-white/8">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8">
                      <FileText className="h-4 w-4 text-white/60" />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-white">
                      See all quote requests
                    </span>
                    <ArrowRight className="ml-auto h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
                  </div>
                </Link>
              </div>
            </div>
          </aside>
        </section>

        {/* Main content based on data */}
        {quotes.length === 0 ? (
          <EmptyState
            action={{
              href: "/get-quote",
              label: "Request your first estimate",
            }}
            description="This account is ready, but nothing has been submitted yet. Start with the estimate visit flow and the dashboard will populate from there."
            illustration="grass"
            title="No requests or properties yet"
          />
        ) : (
          <>
            {/* Pending + Quotes ready */}
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                      Pending visits
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                      Requests in motion
                    </h3>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                    <CalendarClock className="h-4 w-4 text-amber-600" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {pendingRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/8 bg-[#f4f2ec]/50 p-5 text-center text-sm text-black/40">
                      No visit requests are currently waiting.
                    </div>
                  ) : (
                    pendingRequests.map((quote) => {
                      const statusMeta = getQuoteStatusMeta(quote.status);

                      return (
                        <Link
                          className="group block rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 transition-all hover:border-black/12 hover:shadow-sm"
                          key={quote.id}
                          params={{ quoteId: quote.id }}
                          to="/app/quotes/$quoteId"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold tracking-[-0.02em] text-black">
                                {quote.property?.nickname ?? quote.serviceType}
                              </p>
                              <p className="mt-1 truncate text-xs text-black/45">
                                {getPropertyDisplayAddress(quote.property)}
                              </p>
                              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/40">
                                <span>
                                  {formatQuoteWindow(
                                    quote.preferredEndDate,
                                    quote.preferredStartDate
                                  )}
                                </span>
                                <span>
                                  {formatVisitTime(quote.preferredVisitTime)}
                                </span>
                                {quote.scheduledVisitAt ? (
                                  <span className="font-medium text-emerald-700">
                                    Scheduled:{" "}
                                    {formatScheduledVisit(
                                      quote.scheduledVisitAt
                                    )}
                                  </span>
                                ) : null}
                              </div>
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

              <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                      Fixed quotes
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                      Ready for your approval
                    </h3>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {quotesReadyForReview.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/8 bg-[#f4f2ec]/50 p-5 text-center text-sm text-black/40">
                      No fixed quotes are waiting right now. We will show the
                      final price and proposed work date here after the visit.
                    </div>
                  ) : (
                    quotesReadyForReview.map((quote) => {
                      const statusMeta = getQuoteStatusMeta(quote.status);
                      const hasFinalPrice =
                        typeof quote.finalPrice === "number";

                      return (
                        <Link
                          className="group block rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 transition-all hover:border-black/12 hover:shadow-sm"
                          key={quote.id}
                          params={{ quoteId: quote.id }}
                          to="/app/quotes/$quoteId"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold tracking-[-0.02em] text-black">
                                {quote.serviceType}
                              </p>
                              <p className="mt-1 truncate text-xs text-black/45">
                                {getPropertyDisplayAddress(quote.property)}
                              </p>
                              {hasFinalPrice ? (
                                <p className="mt-2 text-sm font-semibold text-emerald-700">
                                  {formatCents(quote.finalPrice)}
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs text-black/45">
                                Work date:{" "}
                                {formatServiceDate(quote.proposedWorkDate)}
                              </p>
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

            {/* Properties */}
            <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                    Saved properties
                  </p>
                  <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                    Addresses on file
                  </h3>
                </div>
                <Link
                  className="text-xs font-medium text-black/40 transition hover:text-black"
                  to="/app/properties"
                >
                  View all →
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <Link
                    className="group rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 transition-all hover:border-black/12 hover:shadow-sm"
                    key={property.id}
                    params={{ propertyId: property.id }}
                    to="/app/properties/$propertyId"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold tracking-[-0.02em] text-black">
                          {property.nickname ?? "Property"}
                        </p>
                        <p className="mt-1 truncate text-xs text-black/45">
                          {getPropertyDisplayAddress(property)}
                        </p>
                        <p className="truncate text-xs text-black/45">
                          {property.city}, {property.state} {property.zip}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Billing */}
            <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                    Billing
                  </p>
                  <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
                    Plans and orders
                  </h3>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-[#f9f8f5] p-4">
                  <p className="text-xs font-medium text-black/40">
                    Open invoices
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black">
                    {
                      invoices.filter((invoice) =>
                        ["draft", "open"].includes(invoice.status)
                      ).length
                    }
                  </p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-[#f9f8f5] p-4">
                  <p className="text-xs font-medium text-black/40">
                    Active work orders
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black">
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
