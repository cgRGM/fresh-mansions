import { createFileRoute } from "@tanstack/react-router";

import SignInForm from "@/components/sign-in-form";

const RouteComponent = () => (
  <div className="min-h-svh bg-[#f6f4ef] px-4 py-12">
    <SignInForm
      headline="Welcome back"
      showQuoteLink
      subhead="Sign in to check your estimates, review quotes, and manage your properties."
    />
  </div>
);

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});
