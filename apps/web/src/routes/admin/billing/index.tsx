import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { listBilling } from "@/functions/admin/list-billing";
import { apiClient } from "@/lib/api-client";
import { formatCents } from "@/lib/estimates";

export const Route = createFileRoute("/admin/billing/")({
  component: AdminBillingPage,
  loader: () => listBilling(),
});

const invoiceTone = (value: string) => {
  switch (value) {
    case "paid": {
      return "bg-[#d6f18b] text-black";
    }
    case "open": {
      return "bg-black text-white";
    }
    default: {
      return "bg-black/6 text-black/65";
    }
  }
};

function AdminBillingPage() {
  const { invoices, subscriptions } = Route.useLoaderData();
  const [invoiceForm, setInvoiceForm] = useState({
    amountDue: "",
    customerId: "",
    dueDate: "",
    note: "",
    workOrderId: "",
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
    customerId: "",
    interval: "month",
    intervalCount: "1",
    nickname: "",
    priceCents: "",
  });

  const customers = [
    ...new Map(
      [...invoices, ...subscriptions].map((record) => [
        record.customerId,
        {
          customerId: record.customerId,
          label: record.customer?.user?.name ?? "Unknown customer",
        },
      ])
    ).values(),
  ];

  const handleInvoiceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setInvoiceForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleSubscriptionChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setSubscriptionForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleInvoiceCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        const response = await apiClient.api.admin.invoices.$post({
          json: {
            amountDue: Number(invoiceForm.amountDue),
            customerId: invoiceForm.customerId,
            dueDate: invoiceForm.dueDate || undefined,
            note: invoiceForm.note || undefined,
            workOrderId: invoiceForm.workOrderId || undefined,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to create invoice");
        }

        toast.success("Invoice created");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create invoice"
        );
      }
    },
    [invoiceForm]
  );

  const handleSubscriptionCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        const response = await apiClient.api.admin.subscriptions.$post({
          json: {
            customerId: subscriptionForm.customerId,
            interval: subscriptionForm.interval,
            intervalCount: Number(subscriptionForm.intervalCount),
            nickname: subscriptionForm.nickname || undefined,
            priceCents: Number(subscriptionForm.priceCents),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to create subscription");
        }

        toast.success("Subscription created");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create subscription"
        );
      }
    },
    [subscriptionForm]
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-2">
        <form
          className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
          onSubmit={handleInvoiceCreate}
        >
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
            Invoices
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-black">
            Send one-off invoices from the operations panel.
          </h1>
          <div className="mt-6 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-customer">Customer</Label>
              <select
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3"
                id="invoice-customer"
                name="customerId"
                onChange={handleInvoiceChange}
                value={invoiceForm.customerId}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.customerId} value={customer.customerId}>
                    {customer.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountDue">Amount due (cents)</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="amountDue"
                name="amountDue"
                onChange={handleInvoiceChange}
                type="number"
                value={invoiceForm.amountDue}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="dueDate"
                name="dueDate"
                onChange={handleInvoiceChange}
                type="date"
                value={invoiceForm.dueDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="note"
                name="note"
                onChange={handleInvoiceChange}
                value={invoiceForm.note}
              />
            </div>
            <Button
              className="h-12 rounded-full bg-black px-5 text-white hover:bg-black/90"
              type="submit"
            >
              Create invoice
            </Button>
          </div>
        </form>

        <form
          className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
          onSubmit={handleSubscriptionCreate}
        >
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
            Monthly plans
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-black">
            Start recurring billing for ongoing maintenance.
          </h2>
          <div className="mt-6 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="subscription-customer">Customer</Label>
              <select
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3"
                id="subscription-customer"
                name="customerId"
                onChange={handleSubscriptionChange}
                value={subscriptionForm.customerId}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.customerId} value={customer.customerId}>
                    {customer.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interval">Interval</Label>
                <select
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3"
                  id="interval"
                  name="interval"
                  onChange={handleSubscriptionChange}
                  value={subscriptionForm.interval}
                >
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalCount">Every</Label>
                <Input
                  className="h-12 rounded-2xl border-black/10"
                  id="intervalCount"
                  name="intervalCount"
                  onChange={handleSubscriptionChange}
                  type="number"
                  value={subscriptionForm.intervalCount}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Plan name</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="nickname"
                name="nickname"
                onChange={handleSubscriptionChange}
                value={subscriptionForm.nickname}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceCents">Recurring amount (cents)</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="priceCents"
                name="priceCents"
                onChange={handleSubscriptionChange}
                type="number"
                value={subscriptionForm.priceCents}
              />
            </div>
            <Button
              className="h-12 rounded-full bg-black px-5 text-white hover:bg-black/90"
              type="submit"
            >
              Create subscription
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
          <h3 className="text-2xl font-semibold tracking-[-0.05em] text-black">
            Recent invoices
          </h3>
          <div className="mt-5 space-y-3">
            {invoices.map((invoice) => (
              <div
                className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4"
                key={invoice.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-black">
                      {invoice.customer?.user?.name ?? "Unknown customer"}
                    </p>
                    <p className="text-sm text-black/58">
                      {formatCents(invoice.amountDue)} due
                    </p>
                    {invoice.hostedInvoiceUrl ? (
                      <a
                        className="mt-2 inline-block text-sm font-medium text-black underline"
                        href={invoice.hostedInvoiceUrl}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        Open hosted invoice
                      </a>
                    ) : null}
                  </div>
                  <Badge className={invoiceTone(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
          <h3 className="text-2xl font-semibold tracking-[-0.05em] text-black">
            Active subscriptions
          </h3>
          <div className="mt-5 space-y-3">
            {subscriptions.map((subscription) => (
              <div
                className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4"
                key={subscription.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-black">
                      {subscription.customer?.user?.name ?? "Unknown customer"}
                    </p>
                    <p className="text-sm text-black/58">
                      {formatCents(subscription.priceCents)} every{" "}
                      {subscription.intervalCount} {subscription.interval}
                    </p>
                  </div>
                  <Badge className={invoiceTone(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
