import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fresh-mansions/ui/components/table";
import { createFileRoute } from "@tanstack/react-router";
import { HardHat } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { listContractors } from "@/functions/admin/list-contractors";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/contractors/")({
  component: AdminContractorsPage,
  loader: () => listContractors(),
});

const statusTone = (value: string) => {
  switch (value) {
    case "active": {
      return "bg-[#d6f18b] text-black";
    }
    case "invited": {
      return "bg-black/8 text-black";
    }
    default: {
      return "bg-black/6 text-black/65";
    }
  }
};

function AdminContractorsPage() {
  const contractors = Route.useLoaderData();
  const [isCreating, setIsCreating] = useState(false);
  const [onboardingLinks, setOnboardingLinks] = useState<
    Record<string, string>
  >({});
  const [form, setForm] = useState({
    contactEmail: "",
    contactPhone: "",
    displayName: "",
  });

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsCreating(true);

      try {
        const response = await apiClient.api.admin.contractors.$post({
          json: form,
        });

        if (!response.ok) {
          throw new Error("Failed to create contractor");
        }

        const payload = (await response.json()) as { password: string };
        toast.success(
          `Contractor created. Temporary password: ${payload.password}`
        );
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create contractor"
        );
      } finally {
        setIsCreating(false);
      }
    },
    [form]
  );

  const handleGenerateOnboardingLink = useCallback(
    async (contractorId: string) => {
      try {
        const response = await apiClient.api.admin.contractors[":id"][
          "onboarding-link"
        ].$post({
          param: { id: contractorId },
        });

        if (!response.ok) {
          throw new Error("Failed to create onboarding link");
        }

        const payload = (await response.json()) as {
          onboardingUrl: null | string;
        };

        if (!payload.onboardingUrl) {
          toast.message("Stripe is not configured yet for onboarding links");
          return;
        }

        setOnboardingLinks((current) => ({
          ...current,
          [contractorId]: payload.onboardingUrl as string,
        }));
        toast.success("Onboarding link ready");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to generate onboarding link"
        );
      }
    },
    []
  );

  return (
    <div className="stagger-children space-y-5">
      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Contractor ops
            </p>
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
              Invite staff, track onboarding, and unlock payouts
            </h1>
          </div>
        </div>

        <form
          className="mt-8 grid gap-4 lg:grid-cols-3"
          onSubmit={handleCreate}
        >
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              className="h-12 rounded-2xl border-black/10"
              id="displayName"
              name="displayName"
              onChange={handleChange}
              placeholder="Marcus Hill"
              value={form.displayName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              className="h-12 rounded-2xl border-black/10"
              id="contactEmail"
              name="contactEmail"
              onChange={handleChange}
              placeholder="crew@example.com"
              value={form.contactEmail}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input
              className="h-12 rounded-2xl border-black/10"
              id="contactPhone"
              name="contactPhone"
              onChange={handleChange}
              placeholder="(555) 123-4567"
              value={form.contactPhone}
            />
          </div>
          <div className="lg:col-span-3">
            <Button
              className="h-12 rounded-full bg-black px-5 text-white hover:bg-black/90"
              disabled={isCreating}
              type="submit"
            >
              {isCreating ? "Creating contractor..." : "Invite contractor"}
            </Button>
          </div>
        </form>
      </section>

      {contractors.length === 0 ? (
        <EmptyState
          description="Invite your first contractor above to start building crews and assigning routes."
          illustration="leaf"
          title="No contractors yet"
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-black/6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Payouts</TableHead>
                <TableHead>Route Load</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractors.map((contractor) => (
                <TableRow key={contractor.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{contractor.displayName}</p>
                      <p className="text-xs text-black/40">
                        {contractor.user?.email ??
                          contractor.contactEmail ??
                          "No email"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{contractor.contactPhone ?? "—"}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-black/55">
                      <p>Stripe: {contractor.stripeAccountStatus}</p>
                      <p>
                        Charges{" "}
                        {contractor.chargesEnabled ? "enabled" : "pending"} /{" "}
                        payouts{" "}
                        {contractor.payoutsEnabled ? "enabled" : "pending"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{contractor.routes.length} routes</TableCell>
                  <TableCell>
                    <Badge className={statusTone(contractor.status)}>
                      {contractor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-y-2">
                    <Button
                      className="h-9 rounded-full bg-black px-4 text-white hover:bg-black/90"
                      onClick={() =>
                        handleGenerateOnboardingLink(contractor.id)
                      }
                      type="button"
                    >
                      Generate onboarding link
                    </Button>
                    {onboardingLinks[contractor.id] ? (
                      <a
                        className="block text-xs font-medium text-black underline"
                        href={onboardingLinks[contractor.id]}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        Open Stripe onboarding
                      </a>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
