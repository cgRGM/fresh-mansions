import { buttonVariants } from "@fresh-mansions/ui/components/button";
import { cn } from "@fresh-mansions/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const GrassIllustration = () => (
  <svg
    aria-hidden="true"
    className="mx-auto w-48 h-32"
    fill="none"
    viewBox="0 0 192 128"
  >
    {/* Ground line */}
    <ellipse cx="96" cy="112" fill="oklch(0.9 0.05 116 / 40%)" rx="80" ry="8" />
    {/* Grass blades */}
    <path
      className="animate-sway"
      d="M60 112 C58 80, 42 60, 48 30"
      stroke="oklch(0.55 0.15 140)"
      strokeLinecap="round"
      strokeWidth="3"
      style={{ animationDelay: "0s", transformOrigin: "60px 112px" }}
    />
    <path
      className="animate-sway"
      d="M80 112 C78 75, 72 50, 76 20"
      stroke="oklch(0.6 0.14 130)"
      strokeLinecap="round"
      strokeWidth="3.5"
      style={{ animationDelay: "0.3s", transformOrigin: "80px 112px" }}
    />
    <path
      className="animate-sway"
      d="M96 112 C100 70, 104 45, 96 15"
      stroke="oklch(0.5 0.16 145)"
      strokeLinecap="round"
      strokeWidth="4"
      style={{ animationDelay: "0.6s", transformOrigin: "96px 112px" }}
    />
    <path
      className="animate-sway"
      d="M112 112 C115 78, 125 55, 118 28"
      stroke="oklch(0.58 0.13 135)"
      strokeLinecap="round"
      strokeWidth="3"
      style={{ animationDelay: "0.15s", transformOrigin: "112px 112px" }}
    />
    <path
      className="animate-sway"
      d="M132 112 C130 85, 140 65, 136 40"
      stroke="oklch(0.52 0.15 142)"
      strokeLinecap="round"
      strokeWidth="3.5"
      style={{ animationDelay: "0.45s", transformOrigin: "132px 112px" }}
    />
    {/* Small leaves / detail */}
    <circle cx="76" cy="22" fill="oklch(0.7 0.12 130)" r="3" />
    <circle cx="96" cy="17" fill="oklch(0.6 0.15 140)" r="4" />
    <circle cx="118" cy="30" fill="oklch(0.65 0.13 135)" r="3" />
  </svg>
);

const LeafIllustration = () => (
  <svg
    aria-hidden="true"
    className="mx-auto w-40 h-32"
    fill="none"
    viewBox="0 0 160 128"
  >
    <path
      className="animate-sway"
      d="M80 110 C80 80, 50 60, 30 30 C55 40, 75 55, 80 80"
      fill="oklch(0.6 0.14 130 / 30%)"
      stroke="oklch(0.5 0.15 140)"
      strokeLinecap="round"
      strokeWidth="2"
      style={{ transformOrigin: "80px 110px" }}
    />
    <path
      className="animate-sway"
      d="M80 110 C80 75, 110 55, 135 25 C110 38, 85 55, 80 80"
      fill="oklch(0.65 0.12 125 / 25%)"
      stroke="oklch(0.55 0.13 135)"
      strokeLinecap="round"
      strokeWidth="2"
      style={{ animationDelay: "0.4s", transformOrigin: "80px 110px" }}
    />
    {/* Stem */}
    <path
      d="M80 110 L80 75"
      stroke="oklch(0.45 0.12 140)"
      strokeLinecap="round"
      strokeWidth="2.5"
    />
    {/* Ground */}
    <ellipse cx="80" cy="115" fill="oklch(0.9 0.05 116 / 35%)" rx="40" ry="5" />
  </svg>
);

const SunIllustration = () => (
  <svg
    aria-hidden="true"
    className="mx-auto w-40 h-32"
    fill="none"
    viewBox="0 0 160 128"
  >
    {/* Sun rays */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <line
        key={angle}
        stroke="oklch(0.8 0.1 90 / 50%)"
        strokeLinecap="round"
        strokeWidth="2"
        transform={`rotate(${String(angle)} 80 60)`}
        x1="80"
        x2="80"
        y1="20"
        y2="30"
      />
    ))}
    {/* Sun body */}
    <circle cx="80" cy="60" fill="oklch(0.85 0.1 90 / 40%)" r="22" />
    <circle cx="80" cy="60" fill="oklch(0.9 0.08 90 / 60%)" r="16" />
    {/* Ground with grass tufts */}
    <ellipse cx="80" cy="110" fill="oklch(0.9 0.05 116 / 35%)" rx="55" ry="6" />
    <path
      d="M55 110 C53 100, 50 95, 52 88"
      stroke="oklch(0.55 0.13 140)"
      strokeLinecap="round"
      strokeWidth="2"
    />
    <path
      d="M80 110 C82 98, 78 92, 80 85"
      stroke="oklch(0.5 0.15 145)"
      strokeLinecap="round"
      strokeWidth="2"
    />
    <path
      d="M105 110 C107 100, 110 94, 108 87"
      stroke="oklch(0.55 0.13 140)"
      strokeLinecap="round"
      strokeWidth="2"
    />
  </svg>
);

const illustrations = {
  grass: GrassIllustration,
  leaf: LeafIllustration,
  sun: SunIllustration,
} as const;

interface EmptyStateProps {
  readonly action?: {
    href: string;
    label: string;
  };
  readonly className?: string;
  readonly description: string;
  readonly icon?: ReactNode;
  readonly illustration?: keyof typeof illustrations;
  readonly title: string;
}

const EmptyState = ({
  action,
  className,
  description,
  icon,
  illustration = "grass",
  title,
}: EmptyStateProps) => {
  const Illustration = illustrations[illustration];

  return (
    <div
      className={cn(
        "animate-fade-in-up rounded-[2rem] border border-dashed border-black/10 bg-white p-10 text-center shadow-[0_16px_50px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {icon ?? <Illustration />}
      <h3 className="mt-6 text-2xl font-semibold tracking-[-0.05em] text-black">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-black/55">
        {description}
      </p>
      {action ? (
        <Link
          className={cn(
            buttonVariants({
              className:
                "mt-6 h-12 rounded-full bg-black px-6 text-white hover:bg-black/90",
            })
          )}
          to={action.href}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
};

export { EmptyState };
