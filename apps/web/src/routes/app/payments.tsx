import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, ExternalLink, Receipt } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { getBillingSummary } from "@/functions/get-billing-summary";
import { formatCents } from "@/lib/estimates";

const PaymentsPage = () => {
  const { invoices, subscriptions } = Route.useLoaderData();

  const hasContent = subscriptions.length > 0 || invoices.length > 0;

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        {/* Header */}
        <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
            Billing
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
            Payments & subscriptions
          </h1>
          <p className="mt-1 text-sm text-black/45">
            Manage your service plans and view invoices.
          </p>
        </div>

        {hasContent ? (
          <>
            {/* Subscriptions */}
            {subscriptions.length > 0 ? (
              <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
                  Active plans
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {subscriptions.map((subscription) => (
                    <div
                      className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4"
                      key={subscription.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                            <CreditCard className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold tracking-[-0.02em] text-black">
                              {subscription.nickname ?? "Service plan"}
                            </p>
                            <p className="mt-1 text-sm text-black/50">
                              {formatCents(subscription.priceCents)} every{" "}
                              {subscription.intervalCount}{" "}
                              {subscription.interval}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700">
                          {subscription.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Invoices */}
            {invoices.length > 0 ? (
              <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
                  Invoices
                </h2>
                <div className="mt-4 space-y-2.5">
                  {invoices.map((invoice) => (
                    <div
                      className="flex items-center justify-between rounded-2xl border border-black/6 bg-[#f9f8f5] p-4"
                      key={invoice.id}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                          <Receipt className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold tracking-[-0.02em] text-black">
                            {formatCents(invoice.amountDue)}
                          </p>
                          <p className="mt-0.5 text-xs text-black/40">
                            {invoice.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[#0a1a10] text-white">
                          {invoice.status}
                        </Badge>
                        {invoice.hostedInvoiceUrl ? (
                          <a
                            className="flex items-center gap-1 text-sm font-medium text-black/50 transition hover:text-black"
                            href={invoice.hostedInvoiceUrl}
                            rel="noreferrer noopener"
                            target="_blank"
                          >
                            Pay
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <EmptyState
            description="When you approve a quote and a recurring plan is set up, your subscriptions and invoices will appear here."
            illustration="leaf"
            title="No billing activity yet"
          />
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/app/payments")({
  component: PaymentsPage,
  loader: () => getBillingSummary(),
});
