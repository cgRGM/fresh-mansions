import { createFileRoute } from "@tanstack/react-router";

import { QuoteStartForm } from "@/components/quote/quote-start-form";
import { QuoteStepLayout } from "@/components/quote/quote-step-layout";

const ScheduleStep = () => (
  <QuoteStepLayout
    description="Pick the dates and time that work best for your property visit. We'll ask for your details on the next step."
    step="Step 1 of 3"
    title="When should we visit?"
  >
    <QuoteStartForm
      ctaLabel="Continue to account"
      className="bg-[#f6f4ef]"
      helperTone="dark"
    />
  </QuoteStepLayout>
);

export const Route = createFileRoute("/get-quote/")({
  component: ScheduleStep,
});
