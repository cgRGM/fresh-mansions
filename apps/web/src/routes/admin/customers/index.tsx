import { db } from "@fresh-mansions/db";
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
import { createServerFn } from "@tanstack/react-start";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { createCustomerBackfill } from "@/functions/admin/create-customer-backfill";
import { validateAddress } from "@/functions/validate-address";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const listCustomers = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () =>
    db.query.customer.findMany({
      orderBy: (customerTable, { desc }) => [desc(customerTable.createdAt)],
      with: {
        properties: true,
        subscriptions: true,
        user: true,
      },
    })
  );

const adminCustomersRouteApi = getRouteApi("/admin/customers/");

const AdminCustomersPage = () => {
  const customers = adminCustomersRouteApi.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [createdPassword, setCreatedPassword] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const [saveUnverifiedAddress, setSaveUnverifiedAddress] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState<null | {
    city: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    radarMetadata?: Record<string, unknown>;
    radarPlaceId?: string;
    state: string;
    street: string;
    validationStatus: "validated";
    zip: string;
  }>(null);
  const [form, setForm] = useState({
    addressLine2: "",
    city: "",
    email: "",
    name: "",
    nickname: "",
    phone: "",
    state: "",
    street: "",
    zip: "",
  });

  const handleFormChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setForm((current) => ({
        ...current,
        [name]: value,
      }));

      if (["addressLine2", "city", "state", "street", "zip"].includes(name)) {
        setValidatedAddress(null);
      }
    },
    []
  );

  const handleValidateAddress = useCallback(async () => {
    setIsValidatingAddress(true);

    try {
      const address = await validateAddress({
        data: {
          addressLine2: form.addressLine2 || undefined,
          city: form.city,
          state: form.state,
          street: form.street,
          zip: form.zip,
        },
      });

      setValidatedAddress(address);
      setForm((current) => ({
        ...current,
        city: address.city,
        state: address.state,
        street: address.street,
        zip: address.zip,
      }));
      toast.success("Address validated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to validate address"
      );
    } finally {
      setIsValidatingAddress(false);
    }
  }, [form.addressLine2, form.city, form.state, form.street, form.zip]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validatedAddress && !saveUnverifiedAddress && form.street) {
        toast.error("Validate the address or mark it as unverified");
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await createCustomerBackfill({
          data: {
            ...form,
            formattedAddress: validatedAddress?.formattedAddress,
            latitude: validatedAddress?.latitude,
            longitude: validatedAddress?.longitude,
            radarMetadata: validatedAddress?.radarMetadata,
            radarPlaceId: validatedAddress?.radarPlaceId,
            validationStatus:
              validatedAddress?.validationStatus ??
              (saveUnverifiedAddress ? "unverified" : "validated"),
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
    [form, saveUnverifiedAddress, validatedAddress]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
          Manual client backfill
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-black">
          Add a legacy client with a temporary password
        </h1>

        <form
          className="mt-8 grid gap-4 lg:grid-cols-2"
          onSubmit={handleSubmit}
        >
          {[
            ["name", "Full name", "Jordan Taylor"],
            ["email", "Email", "jordan@example.com"],
            ["phone", "Phone", "(555) 123-4567"],
            ["nickname", "Property nickname", "Main residence"],
            ["addressLine2", "Address line 2", "Unit, suite, gate code"],
            ["street", "Street", "123 Main Street"],
            ["city", "City", "Harrisonburg"],
            ["state", "State", "VA"],
            ["zip", "ZIP", "22801"],
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

          <div className="rounded-[1.5rem] border border-black/8 bg-[#f6f4ef] p-4 lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-black">Address verification</p>
                <p className="text-sm text-black/55">
                  Validate new addresses when possible. Use the override only
                  when importing legacy customer data that still needs cleanup.
                </p>
                {validatedAddress ? (
                  <p className="mt-2 text-sm text-[#4f7a1d]">
                    Verified: {validatedAddress.formattedAddress}
                  </p>
                ) : null}
              </div>
              <Button
                className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
                disabled={isValidatingAddress}
                onClick={handleValidateAddress}
                type="button"
              >
                {isValidatingAddress ? "Validating..." : "Validate address"}
              </Button>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-black/65">
              <input
                checked={saveUnverifiedAddress}
                onChange={(event) =>
                  setSaveUnverifiedAddress(event.target.checked)
                }
                type="checkbox"
              />
              Save as unverified legacy address if validation is unavailable
            </label>
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
          <div className="mt-6 rounded-[1.5rem] border border-[#d6f18b] bg-[#eef7d5] p-4 text-sm text-black">
            Temporary password for{" "}
            <span className="font-semibold">{createdEmail}</span>:{" "}
            <code className="rounded bg-black px-2 py-1 text-white">
              {createdPassword}
            </code>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
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
                  {customer.user?.name ?? "Unknown"}
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
    </div>
  );
};

export const Route = createFileRoute("/admin/customers/")({
  component: AdminCustomersPage,
  loader: () => listCustomers(),
});
