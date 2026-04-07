/* eslint-disable unicorn/filename-case */

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
import {
  createFileRoute,
  getRouteApi,
  Link,
  useRouter,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Home,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  User,
} from "lucide-react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { AddressAutocomplete } from "@/components/quote/address-autocomplete";
import type { QuoteAddressSelection } from "@/components/quote/address-autocomplete";
import { addCustomerProperty } from "@/functions/admin/add-customer-property";
import { deleteCustomerProperty } from "@/functions/admin/delete-customer-property";
import { getCustomerDetail } from "@/functions/admin/get-customer-detail";
import { updateCustomerProfile } from "@/functions/admin/update-customer-profile";
import { updateCustomerProperty } from "@/functions/admin/update-customer-property";
import { getPropertyDisplayAddress } from "@/lib/address";

type CustomerRecord = NonNullable<
  Awaited<ReturnType<typeof getCustomerDetail>>
>;
const customerDetailRouteApi = getRouteApi("/admin/customers/$customer");

const AdminCustomerDetailPage = () => {
  const customer = customerDetailRouteApi.useLoaderData() as CustomerRecord;
  const router = useRouter();

  const [addressError, setAddressError] = useState("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newAddressSelection, setNewAddressSelection] =
    useState<null | QuoteAddressSelection>(null);
  const [newPropertyForm, setNewPropertyForm] = useState({
    addressLine2: "",
    nickname: "",
  });
  const [profileForm, setProfileForm] = useState({
    email: customer.user?.email ?? "",
    name: customer.user?.name ?? "",
    phone: customer.phone ?? "",
  });

  const [editingPropertyId, setEditingPropertyId] = useState<null | string>(
    null
  );
  const [editingPropertySelection, setEditingPropertySelection] =
    useState<null | QuoteAddressSelection>(null);
  const [propertyDrafts, setPropertyDrafts] = useState<
    Record<
      string,
      {
        addressLine2: string;
        nickname: string;
      }
    >
  >({});

  const activeProperty = useMemo(() => {
    if (!editingPropertyId) {
      return null;
    }

    return (
      customer.properties.find(
        (property) => property.id === editingPropertyId
      ) ?? null
    );
  }, [customer.properties, editingPropertyId]);

  const activePropertyDraft = useMemo(() => {
    if (!editingPropertyId) {
      return null;
    }

    return (
      propertyDrafts[editingPropertyId] ?? {
        addressLine2: activeProperty?.addressLine2 ?? "",
        nickname: activeProperty?.nickname ?? "",
      }
    );
  }, [activeProperty, editingPropertyId, propertyDrafts]);

  const refreshPage = useCallback(async () => {
    await router.invalidate();
  }, [router]);

  const handleProfileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setProfileForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleProfileSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSavingProfile(true);

      try {
        await updateCustomerProfile({
          data: {
            customerId: customer.id,
            email: profileForm.email,
            name: profileForm.name,
            phone: profileForm.phone,
          },
        });
        toast.success("Customer profile updated");
        await refreshPage();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update customer profile"
        );
      } finally {
        setIsSavingProfile(false);
      }
    },
    [
      customer.id,
      profileForm.email,
      profileForm.name,
      profileForm.phone,
      refreshPage,
    ]
  );

  const handleNewPropertyFormChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setNewPropertyForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleNewSelectionChange = useCallback(
    (selection: null | QuoteAddressSelection) => {
      setNewAddressSelection(selection);

      if (selection) {
        setAddressError("");
      }
    },
    []
  );

  const handleNewAddressLine2Change = useCallback((value: string) => {
    setNewPropertyForm((current) => ({
      ...current,
      addressLine2: value,
    }));
  }, []);

  const handleNewPropertySubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!newAddressSelection) {
        setAddressError("Select a validated address before saving");
        toast.error("Select a validated address before saving");
        return;
      }

      setIsAddingAddress(true);

      try {
        await addCustomerProperty({
          data: {
            addressLine2: newPropertyForm.addressLine2,
            city: newAddressSelection.city,
            customerId: customer.id,
            formattedAddress: newAddressSelection.formattedAddress,
            latitude: newAddressSelection.latitude,
            longitude: newAddressSelection.longitude,
            nickname: newPropertyForm.nickname,
            radarMetadata: newAddressSelection.radarMetadata,
            radarPlaceId: newAddressSelection.radarPlaceId,
            state: newAddressSelection.state,
            street: newAddressSelection.street,
            validationStatus: "validated",
            zip: newAddressSelection.zip,
          },
        });

        toast.success("Address added to customer");
        setNewAddressSelection(null);
        setNewPropertyForm({
          addressLine2: "",
          nickname: "",
        });
        await refreshPage();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to add address"
        );
      } finally {
        setIsAddingAddress(false);
      }
    },
    [
      customer.id,
      newAddressSelection,
      newPropertyForm.addressLine2,
      newPropertyForm.nickname,
      refreshPage,
    ]
  );

  const handleEditAddressClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { propertyId } = event.currentTarget.dataset;

      if (!propertyId) {
        return;
      }

      const property = customer.properties.find(
        (record) => record.id === propertyId
      );

      if (!property) {
        return;
      }

      setEditingPropertyId(property.id);
      setEditingPropertySelection(null);
      setPropertyDrafts((current) => ({
        ...current,
        [property.id]: {
          addressLine2: property.addressLine2 ?? "",
          nickname: property.nickname ?? "",
        },
      }));
      setAddressError("");
    },
    [customer.properties]
  );

  const handleEditingSelectionChange = useCallback(
    (selection: null | QuoteAddressSelection) => {
      setEditingPropertySelection(selection);

      if (selection) {
        setAddressError("");
      }
    },
    []
  );

  const handleEditingAddressLine2Change = useCallback(
    (value: string) => {
      if (!editingPropertyId) {
        return;
      }

      setPropertyDrafts((current) => ({
        ...current,
        [editingPropertyId]: {
          ...(current[editingPropertyId] ?? {
            addressLine2: "",
            nickname: "",
          }),
          addressLine2: value,
        },
      }));
    },
    [editingPropertyId]
  );

  const handlePropertyDraftInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!editingPropertyId) {
        return;
      }

      const { name, value } = event.target;

      setPropertyDrafts((current) => ({
        ...current,
        [editingPropertyId]: {
          ...(current[editingPropertyId] ?? {
            addressLine2: "",
            nickname: "",
          }),
          [name]: value,
        },
      }));
    },
    [editingPropertyId]
  );

  const handlePropertyUpdateSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!editingPropertyId || !activeProperty || !activePropertyDraft) {
        return;
      }

      const selection = editingPropertySelection ?? {
        city: activeProperty.city,
        formattedAddress: getPropertyDisplayAddress(activeProperty),
        latitude: activeProperty.latitude ?? 0,
        longitude: activeProperty.longitude ?? 0,
        radarMetadata:
          typeof activeProperty.radarMetadata === "object" &&
          activeProperty.radarMetadata !== null
            ? (activeProperty.radarMetadata as Record<string, unknown>)
            : undefined,
        radarPlaceId: activeProperty.radarPlaceId ?? undefined,
        state: activeProperty.state,
        street: activeProperty.street,
        zip: activeProperty.zip,
      };

      if (
        !selection.street ||
        !selection.city ||
        !selection.state ||
        !selection.zip
      ) {
        setAddressError("Select a validated address before saving");
        toast.error("Select a validated address before saving");
        return;
      }

      try {
        await updateCustomerProperty({
          data: {
            addressLine2: activePropertyDraft.addressLine2,
            city: selection.city,
            customerId: customer.id,
            formattedAddress: selection.formattedAddress,
            latitude: selection.latitude,
            longitude: selection.longitude,
            nickname: activePropertyDraft.nickname,
            propertyId: editingPropertyId,
            radarMetadata: selection.radarMetadata,
            radarPlaceId: selection.radarPlaceId,
            state: selection.state,
            street: selection.street,
            validationStatus: "validated",
            zip: selection.zip,
          },
        });

        toast.success("Address updated");
        setEditingPropertyId(null);
        setEditingPropertySelection(null);
        await refreshPage();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update address"
        );
      }
    },
    [
      activeProperty,
      activePropertyDraft,
      customer.id,
      editingPropertyId,
      editingPropertySelection,
      refreshPage,
    ]
  );

  const handleDeleteAddress = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const { propertyId } = event.currentTarget.dataset;

      if (!propertyId) {
        return;
      }

      try {
        await deleteCustomerProperty({
          data: {
            customerId: customer.id,
            propertyId,
          },
        });
        toast.success("Address removed");

        if (editingPropertyId === propertyId) {
          setEditingPropertyId(null);
          setEditingPropertySelection(null);
        }

        await refreshPage();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to remove address"
        );
      }
    },
    [customer.id, editingPropertyId, refreshPage]
  );

  const handleCancelEditing = useCallback(() => {
    setEditingPropertyId(null);
    setEditingPropertySelection(null);
    setAddressError("");
  }, []);

  return (
    <div className="stagger-children space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-black/45 transition hover:text-black"
        to="/admin/customers"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Customer profile
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
              {customer.user?.name ?? "Unknown"}
            </h1>
            <p className="mt-1 text-sm text-black/55">
              {customer.user?.email ?? "No email"}
            </p>
          </div>
          <Badge className="bg-black text-white">
            {customer.properties.length} addresses
          </Badge>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
              Customer details
            </h2>
          </div>

          <form className="grid gap-4" onSubmit={handleProfileSubmit}>
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input
                className="h-11 rounded-2xl border-black/10"
                id="customer-name"
                name="name"
                onChange={handleProfileChange}
                value={profileForm.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                className="h-11 rounded-2xl border-black/10"
                id="customer-email"
                name="email"
                onChange={handleProfileChange}
                type="email"
                value={profileForm.email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                className="h-11 rounded-2xl border-black/10"
                id="customer-phone"
                name="phone"
                onChange={handleProfileChange}
                value={profileForm.phone}
              />
            </div>

            <Button
              className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
              disabled={isSavingProfile}
              type="submit"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSavingProfile ? "Saving profile..." : "Save profile"}
            </Button>
          </form>
        </section>

        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
              Add new address
            </h2>
          </div>

          <form className="grid gap-4" onSubmit={handleNewPropertySubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-property-nickname">Property nickname</Label>
              <Input
                className="h-11 rounded-2xl border-black/10"
                id="new-property-nickname"
                name="nickname"
                onChange={handleNewPropertyFormChange}
                placeholder="Main house, rental, office"
                value={newPropertyForm.nickname}
              />
            </div>

            <AddressAutocomplete
              addressError={addressError}
              addressLine2={newPropertyForm.addressLine2}
              addressLine2Label="Address line 2"
              label="Validated address"
              onAddressLine2Change={handleNewAddressLine2Change}
              onSelectionChange={handleNewSelectionChange}
              selectedAddress={newAddressSelection}
            />

            <Button
              className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
              disabled={isAddingAddress}
              type="submit"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isAddingAddress ? "Adding address..." : "Add address"}
            </Button>
          </form>
        </section>
      </div>

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Home className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
            Addresses
          </h2>
        </div>

        {customer.properties.length === 0 ? (
          <p className="text-sm text-black/50">
            No addresses on this customer yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Nickname</TableHead>
                <TableHead>Quotes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="max-w-[36ch] whitespace-normal">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-black/30" />
                      <span>{getPropertyDisplayAddress(property)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{property.nickname ?? "—"}</TableCell>
                  <TableCell>{property.quotes.length}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        className="h-8 rounded-full px-3"
                        data-property-id={property.id}
                        onClick={handleEditAddressClick}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        className="h-8 rounded-full px-3"
                        data-property-id={property.id}
                        onClick={handleDeleteAddress}
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {editingPropertyId && activeProperty && activePropertyDraft ? (
        <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Edit address
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-[-0.03em] text-black">
                {activeProperty.nickname ?? "Property"}
              </h3>
            </div>
            <Button
              className="h-9 rounded-full"
              onClick={handleCancelEditing}
              size="sm"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </div>

          <form className="grid gap-4" onSubmit={handlePropertyUpdateSubmit}>
            <div className="space-y-2">
              <Label htmlFor="editing-property-nickname">
                Property nickname
              </Label>
              <Input
                className="h-11 rounded-2xl border-black/10"
                id="editing-property-nickname"
                name="nickname"
                onChange={handlePropertyDraftInput}
                value={activePropertyDraft.nickname}
              />
            </div>

            <AddressAutocomplete
              addressError={addressError}
              addressLine2={activePropertyDraft.addressLine2}
              addressLine2Label="Address line 2"
              label="Validated address"
              onAddressLine2Change={handleEditingAddressLine2Change}
              onSelectionChange={handleEditingSelectionChange}
              selectedAddress={
                editingPropertySelection ?? {
                  city: activeProperty.city,
                  formattedAddress: getPropertyDisplayAddress(activeProperty),
                  latitude: activeProperty.latitude ?? 0,
                  longitude: activeProperty.longitude ?? 0,
                  state: activeProperty.state,
                  street: activeProperty.street,
                  zip: activeProperty.zip,
                }
              }
            />

            <Button
              className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
              type="submit"
            >
              <Save className="mr-2 h-4 w-4" />
              Save address
            </Button>
          </form>
        </section>
      ) : null}

      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
            Customer activity
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Invoices
            </p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black">
              {customer.invoices.length}
            </p>
          </div>
          <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Subscriptions
            </p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black">
              {customer.subscriptions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-black/6 bg-[#f9f8f5] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Properties
            </p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black">
              {customer.properties.length}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export const Route = createFileRoute("/admin/customers/$customer")({
  component: AdminCustomerDetailPage,
  loader: async ({ params }: { params: { customer: string } }) => {
    const customer = await getCustomerDetail({
      data: {
        customerId: params.customer,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer as CustomerRecord;
  },
});
