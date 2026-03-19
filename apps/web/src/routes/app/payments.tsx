import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute } from "@tanstack/react-router";

import { getBillingSummary } from "@/functions/get-billing-summary";
import { formatCents } from "@/lib/estimates";

export const Route = createFileRoute("/app/payments")({
  component: PaymentsPage,
  loader: () => getBillingSummary(),
});

function PaymentsPage() {
  const { invoices, subscriptions } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-semibold tracking-[-0.06em] text-black">
        Payments
      </h1>

      <section className="grid gap-4 md:grid-cols-2">
        {subscriptions.map((subscription) => (
          <article
            className="rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
            key={subscription.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-black">
                  {subscription.nickname ?? "Service plan"}
                </p>
                <p className="mt-1 text-sm text-black/58">
                  {formatCents(subscription.priceCents)} every{" "}
                  {subscription.intervalCount} {subscription.interval}
                </p>
              </div>
              <Badge className="bg-black text-white">
                {subscription.status}
              </Badge>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        {invoices.map((invoice) => (
          <article
            className="rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
            key={invoice.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-black">
                  {formatCents(invoice.amountDue)} invoice
                </p>
                <p className="mt-1 text-sm text-black/58">
                  Status: {invoice.status}
                </p>
                {invoice.hostedInvoiceUrl ? (
                  <a
                    className="mt-2 inline-block text-sm font-medium text-black underline"
                    href={invoice.hostedInvoiceUrl}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    Open payment link
                  </a>
                ) : null}
              </div>
              <Badge className="bg-black text-white">{invoice.status}</Badge>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
