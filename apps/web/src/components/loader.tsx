export default function Loader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated grass blades loader */}
        <svg
          aria-label="Loading"
          className="h-16 w-24"
          fill="none"
          role="img"
          viewBox="0 0 96 64"
        >
          <path
            className="animate-grow-up"
            d="M24 60 C22 40, 18 25, 22 10"
            stroke="oklch(0.55 0.15 140)"
            strokeLinecap="round"
            strokeWidth="3"
            style={{
              animationDelay: "0ms",
              animationDirection: "alternate",
              animationDuration: "0.8s",
              animationIterationCount: "infinite",
              transformOrigin: "24px 60px",
            }}
          />
          <path
            className="animate-grow-up"
            d="M40 60 C42 35, 38 20, 40 5"
            stroke="oklch(0.5 0.16 145)"
            strokeLinecap="round"
            strokeWidth="3.5"
            style={{
              animationDelay: "150ms",
              animationDirection: "alternate",
              animationDuration: "0.8s",
              animationIterationCount: "infinite",
              transformOrigin: "40px 60px",
            }}
          />
          <path
            className="animate-grow-up"
            d="M56 60 C58 38, 54 22, 56 8"
            stroke="oklch(0.6 0.14 130)"
            strokeLinecap="round"
            strokeWidth="4"
            style={{
              animationDelay: "300ms",
              animationDirection: "alternate",
              animationDuration: "0.8s",
              animationIterationCount: "infinite",
              transformOrigin: "56px 60px",
            }}
          />
          <path
            className="animate-grow-up"
            d="M72 60 C70 42, 74 28, 72 12"
            stroke="oklch(0.52 0.15 142)"
            strokeLinecap="round"
            strokeWidth="3"
            style={{
              animationDelay: "450ms",
              animationDirection: "alternate",
              animationDuration: "0.8s",
              animationIterationCount: "infinite",
              transformOrigin: "72px 60px",
            }}
          />
          <ellipse
            cx="48"
            cy="62"
            fill="oklch(0.9 0.05 116 / 40%)"
            rx="36"
            ry="3"
          />
        </svg>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-black/35">
          Loading
        </p>
      </div>
    </div>
  );
}
