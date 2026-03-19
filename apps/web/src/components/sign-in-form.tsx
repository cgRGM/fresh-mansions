import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { useNavigate } from "@tanstack/react-router";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import * as zod from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

const signInSchema = zod.object({
  email: zod.email("Invalid email address"),
  password: zod.string().min(8, "Password must be at least 8 characters"),
});

const SignInForm = ({
  headline = "Welcome back",
  onSwitchToSignUp,
  redirectTo = "/app/dashboard",
  showQuoteLink = true,
  showSwitchLink = false,
  subhead = "Sign in to manage your properties, requests, and scheduled work.",
}: {
  headline?: string;
  onSwitchToSignUp?: () => void;
  redirectTo?: "/app/dashboard";
  showQuoteLink?: boolean;
  showSwitchLink?: boolean;
  subhead?: string;
}) => {
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
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
      event.stopPropagation();

      const parsed = signInSchema.safeParse(formValues);

      if (!parsed.success) {
        const { fieldErrors } = parsed.error.flatten();
        setErrors({
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
        });
        return;
      }

      setIsSubmitting(true);

      await authClient.signIn.email(
        {
          email: parsed.data.email,
          password: parsed.data.password,
        },
        {
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
          onSuccess: () => {
            navigate({
              to: redirectTo,
            });
            toast.success("Sign in successful");
          },
        }
      );

      setIsSubmitting(false);
    },
    [formValues, navigate, redirectTo]
  );

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
      <div className="mb-6 space-y-2 text-center">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/42">
          Existing client access
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.06em] text-black">
          {headline}
        </h1>
        <p className="text-sm leading-6 text-black/58">{subhead}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              className="h-12 rounded-2xl border-black/10"
              id="email"
              name="email"
              onChange={handleChange}
              type="email"
              value={formValues.email}
            />
            {errors.email ? (
              <p className="text-red-500">{errors.email}</p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              className="h-12 rounded-2xl border-black/10"
              id="password"
              name="password"
              onChange={handleChange}
              type="password"
              value={formValues.password}
            />
            {errors.password ? (
              <p className="text-red-500">{errors.password}</p>
            ) : null}
          </div>
        </div>

        <Button
          className="h-12 w-full rounded-full bg-black text-white hover:bg-black/90"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Submitting..." : "Sign In"}
        </Button>
      </form>

      {showSwitchLink && onSwitchToSignUp ? (
        <div className="mt-4 text-center">
          <Button
            className="text-black/60 hover:text-black"
            onClick={onSwitchToSignUp}
            variant="link"
          >
            Need an account? Sign Up
          </Button>
        </div>
      ) : null}

      {showQuoteLink ? (
        <div className="mt-2 text-center">
          <a
            className="text-sm font-medium text-black/60 transition hover:text-black"
            href="/get-quote"
          >
            Need a new estimate? Request a visit.
          </a>
        </div>
      ) : null}
    </div>
  );
};

export default SignInForm;
