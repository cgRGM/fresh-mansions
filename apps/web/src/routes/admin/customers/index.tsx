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
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { AddressAutocomplete } from "@/components/quote/address-autocomplete";
import type { QuoteAddressSelection } from "@/components/quote/address-autocomplete";
import { createCustomerBackfill } from "@/functions/admin/create-customer-backfill";
import { listCustomers } from "@/functions/admin/list-customers";

const adminCustomersRouteApi = getRouteApi("/admin/customers/");

const AdminCustomersPage = () => {
  const customers = adminCustomersRouteApi.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPassword, setCreatedPassword] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const [addressError, setAddressError] = useState("");
  const [validatedAddress, setValidatedAddress] =
    useState<null | QuoteAddressSelection>(null);
  const [form, setForm] = useState({
    addressLine2: "",
    email: "",
    name: "",
    nickname: "",
    phone: "",
  });

  const handleFormChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleAddressSelectionChange = useCallback(
    (selection: null | QuoteAddressSelection) => {
      setValidatedAddress(selection);

      if (selection) {
        setAddressError("");
      }
    },
    []
  );

  const handleAddressLine2Change = useCallback((value: string) => {
    setForm((current) => ({
      ...current,
      addressLine2: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validatedAddress) {
        setAddressError("Select a validated property address to continue");
        toast.error("Select a validated property address");
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await createCustomerBackfill({
          data: {
            ...form,
            city: validatedAddress.city,
            formattedAddress: validatedAddress.formattedAddress,
            fullAddress: validatedAddress.formattedAddress,
            latitude: validatedAddress.latitude,
            longitude: validatedAddress.longitude,
            radarMetadata: validatedAddress.radarMetadata,
            radarPlaceId: validatedAddress.radarPlaceId,
            state: validatedAddress.state,
            street: validatedAddress.street,
            validationStatus: "validated",
            zip: validatedAddress.zip,
          },
        });
        setCreatedEmail(form.email);
        setCreatedPassword(result.password);
        toast.success("Client created");
        window.location.reload();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create client";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, validatedAddress]
  );

  return (
    <div className="stagger-children space-y-5">
      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Manual client backfill
            </p>
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
              Add a legacy client with a temporary password
            </h1>
          </div>
        </div>

        <form
          className="mt-8 grid gap-4 lg:grid-cols-2"
          onSubmit={handleSubmit}
        >
          {[
            ["name", "Full name", "Jordan Taylor"],
            ["email", "Email", "jordan@example.com"],
            ["phone", "Phone", "(555) 123-4567"],
            ["nickname", "Property nickname", "Main residence"],
          ].map(([field, label, placeholder]) => (
            <div className="space-y-2" key={field}>
              <Label htmlFor={field}>{label}</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id={field}
                name={field}
                onChange={handleFormChange}
                placeholder={placeholder}
                value={form[field as keyof typeof form]}
              />
            </div>
          ))}

          <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 lg:col-span-2">
            <div className="mb-4">
              <p className="font-medium text-black">Property address</p>
              <p className="text-sm text-black/50">
                Search once, select the validated address, and we will carry the
                full address through the customer record.
              </p>
            </div>
            <AddressAutocomplete
              addressError={addressError}
              addressLine2={form.addressLine2}
              addressLine2Label="Address Line 2"
              addressPlaceholder="Suite, gate code, or unit"
              label="Validated property address"
              onAddressLine2Change={handleAddressLine2Change}
              onSelectionChange={handleAddressSelectionChange}
              placeholder="Search the service address"
              selectedAddress={validatedAddress}
            />
          </div>

          <div className="lg:col-span-2">
            <Button
              className="h-12 rounded-full bg-black px-5 text-white hover:bg-black/90"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating client..." : "Create client"}
            </Button>
          </div>
        </form>

        {createdPassword ? (
          <div className="mt-6 rounded-2xl border border-[#d6f18b] bg-[#eef7d5] p-4 text-sm text-black">
            Temporary password for{" "}
            <span className="font-semibold">{createdEmail}</span>:{" "}
            <code className="rounded bg-black px-2 py-1 text-white">
              {createdPassword}
            </code>
          </div>
        ) : null}
      </section>

      {customers.length === 0 ? (
        <EmptyState
          description="No customers have been added yet. Use the form above to backfill legacy clients."
          illustration="sun"
          title="No customers yet"
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-black/6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Plans</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <a
                      className="underline-offset-2 hover:underline"
                      href={`/admin/customers/${customer.id}`}
                    >
                      {customer.user?.name ?? "Unknown"}
                    </a>
                  </TableCell>
                  <TableCell>{customer.user?.email ?? "—"}</TableCell>
                  <TableCell>{customer.phone ?? "—"}</TableCell>
                  <TableCell>{customer.properties.length}</TableCell>
                  <TableCell>{customer.subscriptions.length}</TableCell>
                  <TableCell>
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
};

export const Route = createFileRoute("/admin/customers/")({
  component: AdminCustomersPage,
  loader: () => listCustomers(),
});
