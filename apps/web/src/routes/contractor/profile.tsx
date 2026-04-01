import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { HardHat, LogOut, Mail, Phone, Shield } from "lucide-react";
import { useCallback } from "react";

import { getContractorProfile } from "@/functions/contractor/get-contractor-profile";
import { authClient } from "@/lib/auth-client";

const routeApi = getRouteApi("/contractor/profile");

const ContractorProfile = () => {
  const { contractor } = routeApi.useLoaderData();
  const { session } = routeApi.useRouteContext();

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    window.location.href = "/login";
  }, []);

  const displayName =
    contractor?.displayName ?? session.user.name ?? "Contractor";
  const email =
    contractor?.contactEmail ?? session.user.email ?? "No email on file";
  const phone = contractor?.contactPhone ?? "No phone on file";

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        {/* Profile hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1a10] via-[#132b1a] to-[#0f0f0f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_oklch(0.6_0.15_140_/_0.12),_transparent_60%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d6f18b]/15 text-2xl font-bold text-[#d6f18b]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
                {displayName}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <HardHat className="h-3.5 w-3.5 text-[#d6f18b]/60" />
                <span className="text-sm text-white/50">
                  Contractor
                  {contractor?.status ? ` · ${contractor.status}` : ""}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact info */}
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
            Contact information
          </p>
          <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
            Your details
          </h3>

          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#f9f8f5] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <Mail className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-black/40">Email</p>
                <p className="text-sm font-medium text-black">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#f9f8f5] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-black/40">Phone</p>
                <p className="text-sm font-medium text-black">{phone}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment status */}
        {contractor ? (
          <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Payment
            </p>
            <h3 className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-black">
              Stripe account
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-[#f9f8f5] p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-black/30" />
                  <p className="text-xs font-medium text-black/40">
                    Onboarding
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    className={
                      contractor.stripeAccountStatus === "complete"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }
                  >
                    {contractor.stripeAccountStatus}
                  </Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[#f9f8f5] p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-black/30" />
                  <p className="text-xs font-medium text-black/40">Payouts</p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    className={
                      contractor.payoutsEnabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-black/8 text-black/60"
                    }
                  >
                    {contractor.payoutsEnabled ? "Enabled" : "Not enabled"}
                  </Badge>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Sign out */}
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <Button
            className="w-full gap-2 sm:w-auto"
            onClick={handleSignOut}
            variant="outline"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </section>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/contractor/profile")({
  component: ContractorProfile,
  loader: () => getContractorProfile(),
});
