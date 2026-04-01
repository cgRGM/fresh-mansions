import { buttonVariants } from "@fresh-mansions/ui/components/button";
import { cn } from "@fresh-mansions/ui/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Clock3,
  MapPinned,
  ShieldCheck,
  Star,
} from "lucide-react";

import { QuoteStartForm } from "@/components/quote/quote-start-form";

const proofItems = [
  "Estimate visits scheduled around your window, not ours",
  "Property details, notes, and photos in one request",
  "Review, approval, and follow-through tracked from one dashboard",
] as const;

const serviceCards = [
  {
    eyebrow: "Routine care",
    title: "Mowing and recurring maintenance",
  },
  {
    eyebrow: "Project work",
    title: "Landscape refreshes and redesigns",
  },
  {
    eyebrow: "Seasonal reset",
    title: "Leaf cleanup, prep, and recovery work",
  },
] as const;

const steps = [
  {
    copy: "Choose a date range and the exact time you want us to assess the property.",
    number: "01",
    title: "Request the visit",
  },
  {
    copy: "Create your account, add the address, notes, and optional photos in one pass.",
    number: "02",
    title: "Complete onboarding",
  },
  {
    copy: "We confirm the visit, finalize scope, and post the quote inside your dashboard.",
    number: "03",
    title: "Review and approve",
  },
] as const;

const testimonials = [
  {
    location: "Harrisonburg",
    name: "Dana Pierce",
    quote:
      "Third Time feels like a real operations team, not a generic booking form. I knew exactly what would happen next.",
  },
  {
    location: "Staunton",
    name: "Avery Brooks",
    quote:
      "The visit window plus dashboard follow-up made it easy to coordinate a rental property without the usual back-and-forth.",
  },
  {
    location: "Charlottesville",
    name: "Mina Salazar",
    quote:
      "The photo upload saved a phone call. The crew showed up prepared and the quote was clear.",
  },
] as const;

const faqs = [
  {
    answer:
      "Most estimate requests are reviewed within one business day. We use your requested window to coordinate the property visit.",
    question: "How fast do you confirm the visit?",
  },
  {
    answer:
      "Not on the spot. We visit the property first to understand the full scope, then send you a detailed quote — usually within a day or two.",
    question: "Do I get a price immediately?",
  },
  {
    answer:
      "Absolutely. Add notes and upload photos during onboarding so the team arrives with better context.",
    question: "Can I include project details and photos?",
  },
  {
    answer:
      "You create your account while requesting an estimate — it takes about a minute. Already have one? Just sign in when prompted.",
    question: "How does account creation work?",
  },
] as const;

const LandingPage = () => (
  <div className="min-h-svh bg-[#f6f4ef] text-black">
    <header className="sticky top-0 z-40 border-b border-black/8 bg-[#f6f4ef]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          className="text-xl font-semibold tracking-[-0.05em] text-black"
          to="/"
        >
          Third Time
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-black/60 md:flex">
          <a href="#services">Services</a>
          <a href="#process">Process</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            className="text-sm font-medium text-black/60 transition hover:text-black"
            to="/login"
          >
            Log in
          </Link>
          <Link
            className={cn(
              buttonVariants({
                className:
                  "rounded-full bg-black px-5 text-white hover:bg-black/90",
              })
            )}
            to="/get-quote"
          >
            Book visit
          </Link>
        </div>
      </div>
    </header>

    <main>
      <section className="relative overflow-hidden border-b border-black/8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(121,166,59,0.18),_transparent_28%),radial-gradient(circle_at_75%_20%,_rgba(0,0,0,0.05),_transparent_25%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-black/55">
              <ShieldCheck className="h-4 w-4 text-[#79a63b]" />
              Local crews. Reliable service.
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.08em] text-black sm:text-6xl lg:text-7xl">
                Professional lawn care without the runaround.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-black/64 sm:text-xl">
                Pick a time that works, tell us about your property, and track
                everything from one dashboard once we&apos;ve visited.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: CalendarRange,
                  label: "Pick any date range",
                  value: "Visit window",
                },
                {
                  icon: Clock3,
                  label: "Pick your time of day",
                  value: "Arrival window",
                },
                {
                  icon: MapPinned,
                  label: "Address, photos, notes",
                  value: "All in one request",
                },
              ].map((item) => (
                <div
                  className="rounded-[1.75rem] border border-black/8 bg-white p-4 shadow-[0_18px_40px_rgba(0,0,0,0.06)]"
                  key={item.label}
                >
                  <item.icon className="mb-6 h-5 w-5 text-[#79a63b]" />
                  <p className="text-sm text-black/55">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-black">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-black/55">
              {proofItems.map((item) => (
                <span className="inline-flex items-center gap-2" key={item}>
                  <CheckCircle2 className="h-4 w-4 text-[#79a63b]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <QuoteStartForm />
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 py-20" id="services">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/45">
                Service categories
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-black sm:text-4xl">
                One request covers weekly mowing or a full property project.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-black/58">
              Whether it&apos;s a single home or multiple rental properties, the
              process is the same.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {serviceCards.map((card) => (
              <div
                className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.05)]"
                key={card.title}
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-black/45">
                  {card.eyebrow}
                </p>
                <h3 className="mt-10 text-2xl font-semibold tracking-[-0.05em] text-black">
                  {card.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-b border-black/8 bg-black text-white"
        id="process"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/45">
              Process
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
              Three steps from request to quote.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
                key={step.number}
              >
                <p className="text-sm font-semibold text-[#d6f18b]">
                  {step.number}
                </p>
                <h3 className="mt-10 text-2xl font-semibold tracking-[-0.04em]">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/64">
                  {step.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/45">
                Customer proof
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-black sm:text-4xl">
                People remember the clarity, not just the cut grass.
              </h2>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article
                className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.05)]"
                key={item.name}
              >
                <div className="flex items-center gap-1 text-[#79a63b]">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      className="h-4 w-4 fill-current"
                      key={`${item.name}-${index}`}
                    />
                  ))}
                </div>
                <p className="mt-8 text-lg leading-8 text-black/74">
                  “{item.quote}”
                </p>
                <div className="mt-8 text-sm">
                  <p className="font-semibold text-black">{item.name}</p>
                  <p className="text-black/52">{item.location}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 py-20" id="faq">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/45">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-black sm:text-4xl">
              A few specifics before you book the visit.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                className="rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.05)]"
                key={faq.question}
              >
                <h3 className="text-lg font-semibold tracking-[-0.04em] text-black">
                  {faq.question}
                </h3>
                <p className="mt-3 text-sm leading-7 text-black/60">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/45">
              Get started
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
              Start with the estimate visit. We’ll handle the rest from there.
            </h2>
          </div>

          <Link
            className={cn(
              buttonVariants({
                className:
                  "h-12 rounded-full bg-white px-6 text-black hover:bg-white/90",
              })
            )}
            to="/get-quote"
          >
            Start request
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  </div>
);

export const Route = createFileRoute("/")({
  component: LandingPage,
});
