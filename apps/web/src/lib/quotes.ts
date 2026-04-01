import { getQuotePhotoUrl as buildQuotePhotoUrl } from "./api-client";

const legacyStatusMap = {
  pending_review: "requested",
  reviewed: "visit_scheduled",
} as const;

export const quoteStatusMeta = {
  accepted: {
    badge: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20",
    description: "The quote was accepted and the work is ready for dispatch.",
    label: "Accepted",
  },
  quote_sent: {
    badge: "bg-neutral-900 text-white ring-1 ring-neutral-900/20",
    description: "A fixed quote and proposed work date are ready for review.",
    label: "Quote Sent",
  },
  rejected: {
    badge: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20",
    description: "This quote was declined and will not move forward.",
    label: "Declined",
  },
  requested: {
    badge: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
    description: "Waiting for the team to review your request window.",
    label: "Requested",
  },
  visit_scheduled: {
    badge: "bg-lime-500/10 text-lime-700 ring-1 ring-lime-500/20",
    description: "A property assessment visit has been scheduled.",
    label: "Visit Scheduled",
  },
} as const;

export type QuoteStatusKey = keyof typeof quoteStatusMeta;

export const normalizeQuoteStatus = (status: string): QuoteStatusKey => {
  const normalizedStatus =
    legacyStatusMap[status as keyof typeof legacyStatusMap] ?? status;

  if (normalizedStatus in quoteStatusMeta) {
    return normalizedStatus as QuoteStatusKey;
  }

  return "requested";
};

export const getQuoteStatusMeta = (status: string) =>
  quoteStatusMeta[normalizeQuoteStatus(status)];

export const formatQuoteWindow = (
  endDate?: null | string,
  startDate?: null | string
): string => {
  if (!startDate) {
    return "Window pending";
  }

  const startLabel = new Date(startDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

  if (!endDate) {
    return startLabel;
  }

  const endLabel = new Date(endDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

  return `${startLabel} - ${endLabel}`;
};

export const formatVisitTime = (value?: null | string): string => {
  if (!value) {
    return "Time pending";
  }

  const visitWindowLabels: Record<string, string> = {
    afternoon: "Afternoon (12-3 PM)",
    early_morning: "Early morning (7-9 AM)",
    late_afternoon: "Late afternoon (3-6 PM)",
    morning: "Morning (9 AM-12 PM)",
  };

  if (value in visitWindowLabels) {
    return visitWindowLabels[value];
  }

  const [hoursString, minutesString] = value.split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 2, 17, hours, minutes));
};

export const formatScheduledVisit = (value?: Date | null): string => {
  if (!value) {
    return "Not scheduled yet";
  }

  return value.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const formatServiceDate = (value?: null | string): string => {
  if (!value) {
    return "Date pending";
  }

  return new Date(value).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
};

export const getQuotePhotoUrl = (
  photo: { id: string; quoteId: string },
  quoteIdOverride?: string
): string => buildQuotePhotoUrl(photo.id, quoteIdOverride ?? photo.quoteId);
