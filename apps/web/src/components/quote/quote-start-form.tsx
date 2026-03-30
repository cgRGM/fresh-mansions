import { Button } from "@fresh-mansions/ui/components/button";
import { cn } from "@fresh-mansions/ui/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useMemo, useState } from "react";

import { DateRangePicker } from "./date-range-picker";

const TIME_SLOTS = [
  { label: "Early morning (7–9 AM)", value: "early_morning" },
  { label: "Morning (9–12 PM)", value: "morning" },
  { label: "Afternoon (12–3 PM)", value: "afternoon" },
  { label: "Late afternoon (3–6 PM)", value: "late_afternoon" },
] as const;

interface QuoteStartValues {
  endDate: string;
  preferredVisitTime: string;
  startDate: string;
}

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const getDefaultWindow = (): QuoteStartValues => {
  const start = new Date();
  start.setDate(start.getDate() + 2);

  const end = new Date(start);
  end.setDate(start.getDate() + 3);

  return {
    endDate: toDateKey(end),
    preferredVisitTime: "morning",
    startDate: toDateKey(start),
  };
};

export const QuoteStartForm = ({
  className,
  ctaLabel = "Book an estimate visit",
  helperTone = "dark",
  submitTo = "/get-quote/onboarding",
}: {
  className?: string;
  ctaLabel?: string;
  helperTone?: "dark" | "light";
  submitTo?: "/get-quote/onboarding";
}) => {
  const navigate = useNavigate();
  const [values, setValues] = useState<QuoteStartValues>(getDefaultWindow);
  const [errors, setErrors] = useState<
    Partial<Record<keyof QuoteStartValues, string>>
  >({});

  const helperClasses = useMemo(
    () => (helperTone === "light" ? "text-white/64" : "text-black/55"),
    [helperTone]
  );

  const dateRangeValue = useMemo(
    () => ({
      endDate: values.endDate,
      startDate: values.startDate,
    }),
    [values.endDate, values.startDate]
  );

  const validate = useCallback((): boolean => {
    const nextErrors: Partial<Record<keyof QuoteStartValues, string>> = {};

    if (!values.startDate || !values.endDate) {
      nextErrors.startDate = "Choose a full date range for the visit window.";
    }

    if (
      values.startDate &&
      values.endDate &&
      values.startDate > values.endDate
    ) {
      nextErrors.endDate = "The window must end on or after the first day.";
    }

    if (!values.preferredVisitTime) {
      nextErrors.preferredVisitTime = "Pick the best visit time.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [values.endDate, values.preferredVisitTime, values.startDate]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validate()) {
        return;
      }

      navigate({
        search: values,
        to: submitTo,
      });
    },
    [navigate, submitTo, validate, values]
  );

  const handleDateRangeChange = useCallback((nextValue: QuoteStartValues) => {
    setErrors((current) => ({
      ...current,
      endDate: undefined,
      startDate: undefined,
    }));
    setValues((current) => ({
      ...current,
      ...nextValue,
    }));
  }, []);

  const handleTimeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value;
      setErrors((current) => ({
        ...current,
        preferredVisitTime: undefined,
      }));
      setValues((current) => ({
        ...current,
        preferredVisitTime: nextValue,
      }));
    },
    []
  );

  return (
    <form
      className={cn(
        "rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_24px_100px_rgba(0,0,0,0.10)] sm:p-6",
        className
      )}
      onSubmit={handleSubmit}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-black/45">
        <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[0.62rem]">
          FreshMansions
        </span>
        <span>On-site estimate request</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DateRangePicker
          error={errors.startDate ?? errors.endDate}
          onChange={handleDateRangeChange}
          value={dateRangeValue}
        />

        <div>
          <div className="rounded-3xl border border-black/10 bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
            <label
              className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-black/45"
              htmlFor="preferred-visit-time"
            >
              Preferred Window
            </label>
            <div className="flex items-center gap-3">
              <Clock3 className="h-4 w-4 text-black/40" />
              <select
                className="h-auto w-full border-0 bg-transparent px-0 py-0 text-base font-semibold shadow-none focus-visible:outline-none"
                id="preferred-visit-time"
                onChange={handleTimeChange}
                value={values.preferredVisitTime}
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.preferredVisitTime ? (
            <p className="mt-2 text-sm text-rose-600">
              {errors.preferredVisitTime}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-black/8 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className={cn("flex flex-wrap gap-4 text-sm", helperClasses)}>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#79a63b]" />
            Licensed, insured local crews
          </span>
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#79a63b]" />
            Review typically within one business day
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            className="h-12 rounded-full bg-black px-6 text-white hover:bg-black/90"
            type="submit"
          >
            {ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link
            className="inline-flex items-center justify-center rounded-full px-2 text-sm font-medium text-black/60 transition hover:text-black"
            to="/login"
          >
            Existing client sign in
          </Link>
        </div>
      </div>
    </form>
  );
};
