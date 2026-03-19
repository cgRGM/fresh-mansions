import { scheduleSearchSchema } from "@fresh-mansions/db/validators";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import {
  createFileRoute,
  getRouteApi,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import * as zod from "zod";

import { QuoteStepLayout } from "@/components/quote/quote-step-layout";
import { authClient } from "@/lib/auth-client";

const signupSchema = zod.object({
  email: zod.string().email("Enter a valid email"),
  name: zod.string().min(1, "Name is required"),
  password: zod.string().min(8, "Use at least 8 characters"),
  phone: zod.string().optional(),
});

const signupRouteApi = getRouteApi("/get-quote/signup");

const SignupStep = () => {
  const navigate = useNavigate();
  const search = signupRouteApi.useSearch();
  const [formValues, setFormValues] = useState({
    email: "",
    name: "",
    password: "",
    phone: "",
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

      const parsed = signupSchema.safeParse(formValues);

      if (!parsed.success) {
        const { fieldErrors } = parsed.error.flatten();
        setErrors({
          email: fieldErrors.email?.[0],
          name: fieldErrors.name?.[0],
          password: fieldErrors.password?.[0],
          phone: fieldErrors.phone?.[0],
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await authClient.signUp.email({
          email: parsed.data.email,
          name: parsed.data.name,
          password: parsed.data.password,
        });

        if (result.error) {
          toast.error(result.error.message || "Failed to create account");
          return;
        }

        navigate({
          search: {
            ...search,
            phone: parsed.data.phone,
          },
          to: "/get-quote/onboarding",
        });
      } catch {
        toast.error("An unexpected error occurred");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, navigate, search]
  );

  return (
    <QuoteStepLayout
      description="Set up your account so you can track your estimate, review your quote, and manage everything in one place."
      step="Step 2 of 3"
      title="Create your account."
    >
      <div className="rounded-[2rem] border border-white/10 bg-[#f6f4ef] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.20)] sm:p-8">
        <div className="mb-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/45">
            Account details
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-black">
            Your details
          </h2>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label className="text-black/72" htmlFor="name">
              Full Name
            </Label>
            <Input
              className="h-12 rounded-2xl border-black/10 bg-white"
              id="name"
              name="name"
              onChange={handleChange}
              placeholder="Jordan Taylor"
              value={formValues.name}
            />
            {errors.name ? (
              <p className="text-sm text-rose-600">{errors.name}</p>
            ) : null}
          </div>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-black/72" htmlFor="phone">
                Phone Number
              </Label>
              <Input
                className="h-12 rounded-2xl border-black/10 bg-white"
                id="phone"
                name="phone"
                onChange={handleChange}
                placeholder="(555) 123-4567"
                type="tel"
                value={formValues.phone}
              />
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
                placeholder="Create a password"
                type="password"
                value={formValues.password}
              />
              {errors.password ? (
                <p className="text-sm text-rose-600">{errors.password}</p>
              ) : null}
            </div>
          </div>

          <Button
            className="mt-4 h-12 w-full rounded-full bg-black text-white hover:bg-black/90"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Creating account..."
              : "Continue to property details"}
          </Button>

          <p className="text-center text-sm text-black/55">
            Already have an account?{" "}
            <Link
              className="font-semibold text-black transition hover:text-black/70"
              search={search}
              to="/get-quote/login"
            >
              Sign in instead
            </Link>
          </p>
        </form>
      </div>
    </QuoteStepLayout>
  );
};

export const Route = createFileRoute("/get-quote/signup")({
  component: SignupStep,
  validateSearch: scheduleSearchSchema,
});
