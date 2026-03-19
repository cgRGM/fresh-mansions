import { Badge } from "@fresh-mansions/ui/components/badge";
import { Input } from "@fresh-mansions/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fresh-mansions/ui/components/table";
import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from "@tanstack/react-router";
import type { ChangeEvent, MouseEvent } from "react";
import { useCallback, useMemo, useState } from "react";

import { listQuotes } from "@/functions/admin/list-quotes";
import { formatCents } from "@/lib/estimates";
import {
  formatQuoteWindow,
  formatScheduledVisit,
  getQuoteStatusMeta,
  normalizeQuoteStatus,
} from "@/lib/quotes";

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Requested", value: "requested" },
  { label: "Visit scheduled", value: "visit_scheduled" },
  { label: "Quote ready", value: "quote_ready" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Converted", value: "converted" },
] as const;

const adminQuotesRouteApi = getRouteApi("/admin/quotes/");

const AdminQuotesPage = () => {
  const quotes = adminQuotesRouteApi.useLoaderData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value);
    },
    []
  );

  const handleStatusFilterClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const nextStatus = event.currentTarget
        .value as (typeof STATUS_OPTIONS)[number]["value"];

      setStatusFilter(nextStatus);
    },
    []
  );

  const handleRowClick = useCallback(
    (event: MouseEvent<HTMLTableRowElement>) => {
      const { quoteId } = event.currentTarget.dataset;

      if (!quoteId) {
        return;
      }

      navigate({
        params: { quoteId },
        to: "/admin/quotes/$quoteId",
      });
    },
    [navigate]
  );

  const filteredQuotes = useMemo(
    () =>
      quotes.filter((quote) => {
        const normalizedStatus = normalizeQuoteStatus(quote.status);
        const matchesStatus =
          statusFilter === "all" || normalizedStatus === statusFilter;
        const searchableContent = [
          quote.customer?.user?.name,
          quote.customer?.user?.email,
          quote.property?.street,
          quote.property?.city,
          quote.serviceType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesSearch =
          search.trim().length === 0 ||
          searchableContent.includes(search.trim().toLowerCase());

        return matchesStatus && matchesSearch;
      }),
    [quotes, search, statusFilter]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
          Admin quotes
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-black">
          Visit requests and quote operations
        </h1>
      </div>

      <div className="rounded-[2rem] border border-black/8 bg-white p-5 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <Input
            className="h-12 rounded-2xl border-black/10"
            onChange={handleSearchChange}
            placeholder="Search customer, email, property, or service"
            value={search}
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                className={
                  statusFilter === option.value
                    ? "rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
                    : "rounded-full border border-black/10 bg-[#f6f4ef] px-4 py-2 text-sm font-medium text-black/68"
                }
                key={option.value}
                onClick={handleStatusFilterClick}
                type="button"
                value={option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Scheduled visit</TableHead>
              <TableHead>Estimate</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-12 text-center text-black/55"
                  colSpan={6}
                >
                  No requests match this filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => {
                const statusMeta = getQuoteStatusMeta(quote.status);
                const hasEstimateRange =
                  typeof quote.estimateLow === "number" &&
                  typeof quote.estimateHigh === "number";

                return (
                  <TableRow
                    className="cursor-pointer hover:bg-[#f6f4ef]"
                    data-quote-id={quote.id}
                    key={quote.id}
                    onClick={handleRowClick}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <p>{quote.customer?.user?.name ?? "Unknown"}</p>
                        <p className="text-xs text-black/48">
                          {quote.customer?.user?.email ?? "No email"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {quote.property
                        ? `${quote.property.street}, ${quote.property.city}`
                        : "No address"}
                    </TableCell>
                    <TableCell>
                      {formatQuoteWindow(
                        quote.preferredEndDate,
                        quote.preferredStartDate
                      )}
                    </TableCell>
                    <TableCell>
                      {formatScheduledVisit(quote.scheduledVisitAt)}
                    </TableCell>
                    <TableCell>
                      {hasEstimateRange
                        ? `${formatCents(quote.estimateLow)} - ${formatCents(quote.estimateHigh)}`
                        : "Pending"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusMeta.badge}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/admin/quotes/")({
  component: AdminQuotesPage,
  loader: () => listQuotes(),
});
