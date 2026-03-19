import { Button } from "@fresh-mansions/ui/components/button";
import { cn } from "@fresh-mansions/ui/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface DateRangeValue {
  endDate: string;
  startDate: string;
}

interface CalendarDay {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const parseDateKey = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
};

const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);

const addMonths = (date: Date, offset: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + offset, 1, 12, 0, 0, 0);

const buildMonthDays = (monthDate: Date): CalendarDay[] => {
  const monthStart = startOfMonth(monthDate);
  const firstWeekday = monthStart.getDay();
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);

    return {
      date: current,
      dateKey: toDateKey(current),
      isCurrentMonth: current.getMonth() === monthDate.getMonth(),
    };
  });
};

const isWithinRange = (
  candidate: string,
  endDate?: string,
  startDate?: string
): boolean => {
  if (!startDate || !endDate) {
    return false;
  }

  return candidate >= startDate && candidate <= endDate;
};

const formatRangeLabel = (endDate?: string, startDate?: string): string => {
  if (!startDate) {
    return "Pick a visit window";
  }

  const startLabel = parseDateKey(startDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

  if (!endDate) {
    return startLabel;
  }

  const endLabel = parseDateKey(endDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

  return `${startLabel} - ${endLabel}`;
};

export const DateRangePicker = ({
  className,
  error,
  onChange,
  value,
}: {
  className?: string;
  error?: string;
  onChange: (value: DateRangeValue) => void;
  value: DateRangeValue;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(value.startDate ? parseDateKey(value.startDate) : new Date())
  );
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const monthPanels = useMemo(
    () => [visibleMonth, addMonths(visibleMonth, 1)],
    [visibleMonth]
  );

  const handleSelect = useCallback(
    (nextDateKey: string) => {
      if (!nextDateKey) {
        return;
      }

      if (!value.startDate || (value.startDate && value.endDate)) {
        onChange({ endDate: "", startDate: nextDateKey });
        return;
      }

      if (nextDateKey < value.startDate) {
        onChange({
          endDate: value.startDate,
          startDate: nextDateKey,
        });
        setIsOpen(false);
        return;
      }

      onChange({
        endDate: nextDateKey,
        startDate: value.startDate,
      });
      setIsOpen(false);
    },
    [onChange, value.endDate, value.startDate]
  );

  const handleToggleOpen = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  const handlePreviousMonth = useCallback(() => {
    setVisibleMonth((current) => addMonths(current, -1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setVisibleMonth((current) => addMonths(current, 1));
  }, []);

  const handleClear = useCallback(() => {
    onChange({ endDate: "", startDate: "" });
  }, [onChange]);

  const handleDayClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      handleSelect(event.currentTarget.dataset.dateKey ?? "");
    },
    [handleSelect]
  );

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        aria-expanded={isOpen}
        className={cn(
          "flex min-h-14 w-full items-center justify-between rounded-3xl border border-black/10 bg-white px-5 py-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.08)] transition hover:border-black/30 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]",
          error && "border-rose-500/60 ring-2 ring-rose-500/10"
        )}
        onClick={handleToggleOpen}
        type="button"
      >
        <div className="space-y-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-black/45">
            Visit Window
          </p>
          <p className="text-base font-semibold text-black">
            {formatRangeLabel(value.endDate, value.startDate)}
          </p>
        </div>
        {(value.startDate || value.endDate) && (
          <span className="rounded-full border border-black/10 bg-black/[0.03] p-2 text-black/50">
            <X className="h-4 w-4" />
          </span>
        )}
      </button>

      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+14px)] z-50 w-full min-w-[320px] rounded-[2rem] border border-black/10 bg-[#f6f4ef] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.16)] lg:min-w-[720px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-black">
                Select the date range that works for the property assessment.
              </p>
              <p className="text-sm text-black/55">
                First click sets the start. Second click closes the range.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="h-10 w-10 rounded-full border border-black/10 bg-white p-0 text-black shadow-none hover:bg-white"
                onClick={handlePreviousMonth}
                type="button"
                variant="ghost"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                className="h-10 w-10 rounded-full border border-black/10 bg-white p-0 text-black shadow-none hover:bg-white"
                onClick={handleNextMonth}
                type="button"
                variant="ghost"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {monthPanels.map((monthDate) => {
              const monthDays = buildMonthDays(monthDate);

              return (
                <div
                  className="rounded-[1.5rem] border border-black/8 bg-white p-4"
                  key={monthDate.toISOString()}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-black/50">
                      {monthDate.toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-black/35">
                    {WEEKDAY_LABELS.map((weekday) => (
                      <span key={weekday}>{weekday}</span>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-2">
                    {monthDays.map((day) => {
                      const isRangeEdge =
                        day.dateKey === value.startDate ||
                        day.dateKey === value.endDate;
                      const isSelected = isRangeEdge;
                      const isInRange = isWithinRange(
                        day.dateKey,
                        value.endDate,
                        value.startDate
                      );

                      return (
                        <button
                          className={cn(
                            "flex h-11 items-center justify-center rounded-2xl text-sm font-medium transition",
                            day.isCurrentMonth ? "text-black" : "text-black/25",
                            isSelected &&
                              "bg-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)]",
                            !isSelected &&
                              isInRange &&
                              "bg-[#d6f18b] text-black",
                            !isSelected && !isInRange && "hover:bg-black/[0.05]"
                          )}
                          data-date-key={day.dateKey}
                          key={day.dateKey}
                          onClick={handleDayClick}
                          type="button"
                        >
                          {day.date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-[1.5rem] border border-black/8 bg-white px-4 py-3">
            <div className="text-sm text-black/60">
              {value.startDate && value.endDate
                ? `Selected ${formatRangeLabel(value.endDate, value.startDate)}`
                : "No visit window selected yet."}
            </div>
            <Button
              className="rounded-full border border-black/10 bg-transparent px-4 text-black shadow-none hover:bg-black/[0.04]"
              onClick={handleClear}
              type="button"
              variant="ghost"
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
