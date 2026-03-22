import { scheduleSearchSchema } from "@fresh-mansions/db/validators";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import * as zod from "zod";

import { QuoteStepLayout } from "@/components/quote/quote-step-layout";
import { authClient } from "@/lib/auth-client";

const loginSchema = zod.object({
  email: zod.string().email("Enter a valid email"),
  password: zod.string().min(1, "Password is required"),
});

const loginRouteApi = getRouteApi("/get-quote/login");
const buildQuoteStepUrl = (
  pathname: string,
  search: Record<string, string | undefined>
): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

const LoginStep = () => {
  const search = loginRouteApi.useSearch();
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formValues, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const parsed = loginSchema.safeParse(formValues);

      if (!parsed.success) {
        const { fieldErrors } = parsed.error.flatten();
        setErrors({
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await authClient.signIn.email({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (result.error) {
          toast.error(result.error.message || "Invalid credentials");
          return;
        }

        window.location.assign(
          buildQuoteStepUrl("/get-quote/onboarding", search)
        );
      } catch {
        toast.error("An unexpected error occurred");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, search]
  );

  return (
    <QuoteStepLayout
      description="If you already have a FreshMansions account, sign in and we’ll take you straight into the property details for this estimate request."
      step="Step 2 of 3"
      title="Sign in and finish the request."
    >
      <div className="rounded-[2rem] border border-white/10 bg-[#f6f4ef] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.20)] sm:p-8">
        <div className="mb-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/45">
            Existing client access
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-black">
            Continue with your existing account.
          </h2>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label className="text-black/72" htmlFor="email">
              Email
            </Label>
            <Input
              className="h-12 rounded-2xl border-black/10 bg-white"
              id="email"
              name="email"
              onChange={handleChange}
              placeholder="you@example.com"
              type="email"
              value={formValues.email}
            />
            {errors.email ? (
              <p className="text-sm text-rose-600">{errors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-black/72" htmlFor="password">
              Password
            </Label>
            <Input
              className="h-12 rounded-2xl border-black/10 bg-white"
              id="password"
              name="password"
              onChange={handleChange}
              placeholder="Your password"
              type="password"
              value={formValues.password}
            />
            {errors.password ? (
              <p className="text-sm text-rose-600">{errors.password}</p>
            ) : null}
          </div>

          <Button
            className="mt-4 h-12 w-full rounded-full bg-black text-white hover:bg-black/90"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Continue to property details"}
          </Button>

          <p className="text-center text-sm text-black/55">
            Need to create a new account?{" "}
            <Link
              className="font-semibold text-black transition hover:text-black/70"
              search={search}
              to="/get-quote/signup"
            >
              Go back to sign up
            </Link>
          </p>
        </form>
      </div>
    </QuoteStepLayout>
  );
};

export const Route = createFileRoute("/get-quote/login")({
  component: LoginStep,
  validateSearch: scheduleSearchSchema,
});
