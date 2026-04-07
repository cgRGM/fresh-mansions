/* eslint-disable unicorn/filename-case */

import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import {
  createFileRoute,
  getRouteApi,
  Link,
  useRouter,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Camera,
  ClipboardList,
  MapPin,
  StickyNote,
  User,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { sendQuote } from "@/functions/admin/finalize-quote";
import { getAdminQuoteDetail } from "@/functions/admin/get-quote-detail";
import { scheduleVisit } from "@/functions/admin/schedule-visit";
import { getPropertyDisplayAddress } from "@/lib/address";
import { formatCents } from "@/lib/estimates";
import {
  formatServiceDate,
  formatQuoteWindow,
  formatVisitTime,
  getQuotePhotoUrl,
  getQuoteStatusMeta,
} from "@/lib/quotes";

const toDateTimeLocal = (value?: Date | null): string => {
  if (!value) {
    return "";
  }

  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const hasFinalPriceValue = (
  value: null | number | undefined
): value is number => value !== null && value !== undefined;

interface QuoteDetailRecord {
  customer: {
    phone: null | string;
    user: {
      email: string;
      name: string;
    } | null;
  } | null;
  finalPrice: null | number;
  id: string;
  notes: null | string;
  photos: {
    filename: null | string;
    id: string;
    quoteId: string;
    url: string;
  }[];
  preferredEndDate: null | string;
  preferredStartDate: null | string;
  preferredVisitTime: null | string;
  property: null | {
    addressLine2?: null | string;
    city?: null | string;
    formattedAddress?: null | string;
    fullAddress?: null | string;
    nickname?: null | string;
    state?: null | string;
    street?: null | string;
    zip?: null | string;
  };
  proposedWorkDate: null | string;
  scheduledVisitAt: Date | null;
  serviceType: string;
  status: string;
  workOrders: { id: string }[];
}

const routeApi = getRouteApi("/admin/quotes/$quoteId");

const AdminQuoteDetailPage = () => {
  const quoteData = routeApi.useLoaderData() as null | QuoteDetailRecord;
  const router = useRouter();
  const quoteId = quoteData?.id ?? "";
  const [scheduledVisitAt, setScheduledVisitAt] = useState(
    toDateTimeLocal(quoteData?.scheduledVisitAt)
  );
  const [finalPrice, setFinalPrice] = useState(() =>
    hasFinalPriceValue(quoteData?.finalPrice)
      ? String(quoteData.finalPrice / 100)
      : ""
  );
  const [proposedWorkDate, setProposedWorkDate] = useState(
    quoteData?.proposedWorkDate ?? ""
  );

  const handleScheduledVisitAtChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setScheduledVisitAt(event.target.value);
    },
    []
  );

  const handleFinalPriceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFinalPrice(event.target.value);
    },
    []
  );

  const handleProposedWorkDateChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setProposedWorkDate(event.target.value);
    },
    []
  );

  const handleSchedule = useCallback(async () => {
    if (!quoteData) {
      return;
    }

    if (!scheduledVisitAt) {
      toast.error("Choose the visit date and time first");
      return;
    }

    try {
      await scheduleVisit({
        data: {
          quoteId,
          scheduledVisitAt: new Date(scheduledVisitAt).toISOString(),
        },
      });
      toast.success("Visit scheduled");
      await router.invalidate();
    } catch {
      toast.error("Failed to schedule the visit");
    }
  }, [quoteData, quoteId, router, scheduledVisitAt]);

  const handleSendQuote = useCallback(async () => {
    if (!quoteData) {
      return;
    }

    const parsedFinalPrice = Math.round(Number(finalPrice) * 100);

    if (Number.isNaN(parsedFinalPrice) || parsedFinalPrice <= 0) {
      toast.error("Enter the final quoted amount");
      return;
    }

    if (!proposedWorkDate) {
      toast.error("Choose the proposed work date");
      return;
    }

    try {
      await sendQuote({
        data: {
          finalPrice: parsedFinalPrice,
          proposedWorkDate,
          quoteId,
        },
      });
      toast.success("Quote sent to customer");
      await router.invalidate();
    } catch {
      toast.error("Failed to send the quote");
    }
  }, [finalPrice, proposedWorkDate, quoteData, quoteId, router]);

  if (!quoteData) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center text-black/55 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        Quote not found.
      </div>
    );
  }

  const currentQuotePrice = hasFinalPriceValue(quoteData.finalPrice)
    ? formatCents(quoteData.finalPrice)
    : "Not sent yet";
  const statusMeta = getQuoteStatusMeta(quoteData.status);
  const propertyNickname =
    quoteData.property &&
    "nickname" in quoteData.property &&
    typeof quoteData.property.nickname === "string"
      ? quoteData.property.nickname
      : null;

  return (
    <div className="stagger-children space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-black/50 transition hover:text-black"
        to="/admin/quotes"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to requests
      </Link>

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Request detail
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
              {quoteData.serviceType}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">
              {statusMeta.description}
            </p>
          </div>
          <Badge className={statusMeta.badge}>{statusMeta.label}</Badge>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
              Customer and property
            </h2>
          </div>
          <div className="mt-5 space-y-4 text-sm text-black/55">
            <div>
              <p className="font-medium text-black">
                {quoteData.customer?.user?.name ?? "Unknown customer"}
              </p>
              <p>{quoteData.customer?.user?.email ?? "No email"}</p>
              <p>{quoteData.customer?.phone ?? "No phone"}</p>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-black/30" />
              <div>
                <p className="font-medium text-black">
                  {getPropertyDisplayAddress(quoteData.property)}
                </p>
                <p>Nickname: {propertyNickname ?? "None"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 text-black/30" />
              <div>
                <p>
                  Requested window:{" "}
                  {formatQuoteWindow(
                    quoteData.preferredEndDate,
                    quoteData.preferredStartDate
                  )}
                </p>
                <p>
                  Preferred arrival:{" "}
                  {formatVisitTime(quoteData.preferredVisitTime)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
              Operations
            </h2>
          </div>

          <div className="mt-5 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="scheduledVisitAt">Schedule estimate visit</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="scheduledVisitAt"
                onChange={handleScheduledVisitAtChange}
                type="datetime-local"
                value={scheduledVisitAt}
              />
              <Button
                className="rounded-full bg-black text-white hover:bg-black/90"
                onClick={handleSchedule}
                type="button"
              >
                Save visit timing
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="finalPrice">Final quoted price</Label>
                <Input
                  className="h-12 rounded-2xl border-black/10"
                  id="finalPrice"
                  onChange={handleFinalPriceChange}
                  step="0.01"
                  type="number"
                  value={finalPrice}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposedWorkDate">Proposed work date</Label>
                <Input
                  className="h-12 rounded-2xl border-black/10"
                  id="proposedWorkDate"
                  onChange={handleProposedWorkDateChange}
                  type="date"
                  value={proposedWorkDate}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full bg-black text-white hover:bg-black/90"
                onClick={handleSendQuote}
                type="button"
              >
                Send fixed quote
              </Button>
            </div>

            <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 text-sm text-black/55">
              <p>Current quote: {currentQuotePrice}</p>
              <p className="mt-1">
                Proposed work date:{" "}
                {formatServiceDate(quoteData.proposedWorkDate)}
              </p>
              <p className="mt-1">Customer status: {statusMeta.label}</p>
              <p className="mt-1">
                Work orders created: {quoteData.workOrders.length}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <StickyNote className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
            Notes
          </h2>
        </div>
        <p className="mt-4 text-sm leading-7 text-black/55">
          {quoteData.notes ?? "No extra notes on this request."}
        </p>
      </section>

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Camera className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
            Uploaded photos
          </h2>
        </div>
        {quoteData.photos.length === 0 ? (
          <p className="mt-3 text-sm text-black/50">No photos uploaded.</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quoteData.photos.map((photo) => (
              <div
                className="overflow-hidden rounded-2xl border border-black/6 bg-[#f9f8f5]"
                key={photo.id}
              >
                <img
                  alt={photo.filename ?? "Quote photo"}
                  className="h-48 w-full object-cover"
                  src={getQuotePhotoUrl(photo)}
                />
                <div className="px-4 py-3 text-sm text-black/50">
                  {photo.filename ?? "Uploaded photo"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const Route = createFileRoute("/admin/quotes/$quoteId")({
  component: AdminQuoteDetailPage,
  loader: ({ params }) =>
    getAdminQuoteDetail({ data: { quoteId: params.quoteId } }),
});
