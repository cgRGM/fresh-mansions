import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export const QuoteStepLayout = ({
  children,
  description,
  step,
  title,
}: {
  children: ReactNode;
  description: string;
  step: string;
  title: string;
}) => (
  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-10 flex items-center justify-between">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
        to="/"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
        {step}
      </p>
    </div>

    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <div className="space-y-5">
        <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/70">
          FreshMansions estimate visit
        </p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-lg text-base leading-7 text-white/64">
          {description}
        </p>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          We visit your property first to see exactly what&apos;s needed, then
          send you a clear quote you can review and approve from your dashboard.
        </div>
      </div>

      <div>{children}</div>
    </div>
  </div>
);
