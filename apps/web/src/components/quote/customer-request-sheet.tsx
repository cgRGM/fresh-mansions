import { buildFullAddress } from "@fresh-mansions/db/address";
import type { QuoteIntakeInput } from "@fresh-mansions/db/validators";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@fresh-mansions/ui/components/sheet";
import { Textarea } from "@fresh-mansions/ui/components/textarea";
import { cn } from "@fresh-mansions/ui/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Home, Loader2, MapPin, Plus } from "lucide-react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AddressAutocomplete } from "@/components/quote/address-autocomplete";
import type { QuoteAddressSelection } from "@/components/quote/address-autocomplete";
import { DateRangePicker } from "@/components/quote/date-range-picker";
import { submitQuoteDraft } from "@/lib/quote-submission";

const TIME_SLOTS = [
  { label: "Early morning (7–9 AM)", value: "early_morning" },
  { label: "Morning (9–12 PM)", value: "morning" },
  { label: "Afternoon (12–3 PM)", value: "afternoon" },
  { label: "Late afternoon (3–6 PM)", value: "late_afternoon" },
] as const;

const SERVICE_TYPE_OPTIONS = [
  { label: "Mowing", value: "mowing" },
  { label: "Landscaping", value: "landscaping" },
  { label: "Cleanup", value: "cleanup" },
  { label: "Fertilization", value: "fertilization" },
] as const;

const PROPERTY_SIZE_OPTIONS = [
  { label: "Not sure yet", value: "" },
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
  { label: "X-Large", value: "xlarge" },
] as const;

interface SavedPropertyOption {
  addressLine2?: null | string;
  fullAddress: string;
  id: string;
  nickname?: null | string;
}

interface QuickRequestValues {
  addressLine2: string;
  endDate: string;
  nickname: string;
  notes: string;
  preferredVisitTime: string;
  propertySize: string;
  serviceType: string;
  startDate: string;
}

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const getDefaultWindow = (): Pick<
  QuickRequestValues,
  "endDate" | "preferredVisitTime" | "startDate"
> => {
  const start = new Date();
  start.setDate(start.getDate() + 2);

  const end = new Date(start);
  end.setDate(start.getDate() + 3);

  return {
    endDate: toDateKey(end),
    preferredVisitTime: "morning",
    startDate: toDateKey(start),
  };
};

const buildInitialValues = (): QuickRequestValues => ({
  addressLine2: "",
  nickname: "",
  notes: "",
  propertySize: "",
  serviceType: "",
  ...getDefaultWindow(),
});

export const CustomerRequestSheet = ({
  initialPropertyId,
  onOpenChange,
  open,
  properties,
}: {
  initialPropertyId?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  properties: SavedPropertyOption[];
}) => {
  const navigate = useNavigate();
  const [values, setValues] = useState<QuickRequestValues>(buildInitialValues);
  const [selectedPropertyId, setSelectedPropertyId] = useState<null | string>(
    null
  );
  const [selectedAddress, setSelectedAddress] =
    useState<null | QuoteAddressSelection>(null);
  const [useNewAddress, setUseNewAddress] = useState(properties.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    address?: string;
    dateRange?: string;
    propertyId?: string;
    preferredVisitTime?: string;
    serviceType?: string;
  }>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(buildInitialValues());
    setSelectedAddress(null);
    setErrors({});

    if (properties.length === 0) {
      setUseNewAddress(true);
      setSelectedPropertyId(null);
      return;
    }

    const matchingProperty = properties.find(
      (property) => property.id === initialPropertyId
    );
    const fallbackProperty = matchingProperty ?? properties[0];

    setUseNewAddress(false);
    setSelectedPropertyId(fallbackProperty?.id ?? null);
  }, [initialPropertyId, open, properties]);

  const handleFormValueChange = useCallback(
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = event.target;

      setValues((current) => ({
        ...current,
        [name]: value,
      }));
      setErrors((current) => ({
        ...current,
        [name]: undefined,
      }));
    },
    []
  );

  const handleAddressLine2Change = useCallback((value: string) => {
    setValues((current) => ({
      ...current,
      addressLine2: value,
    }));
  }, []);

  const handleAddressSelectionChange = useCallback(
    (address: null | QuoteAddressSelection) => {
      setSelectedAddress(address);
      setErrors((current) => ({
        ...current,
        address: undefined,
      }));
    },
    []
  );

  const handleDateRangeChange = useCallback(
    (nextValue: { endDate: string; startDate: string }) => {
      setValues((current) => ({
        ...current,
        ...nextValue,
      }));
      setErrors((current) => ({
        ...current,
        dateRange: undefined,
      }));
    },
    []
  );

  const openSavedPropertyMode = useCallback(() => {
    setUseNewAddress(false);
    setSelectedAddress(null);
    setErrors((current) => ({
      ...current,
      address: undefined,
      propertyId: undefined,
    }));

    if (!selectedPropertyId && properties[0]) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const openNewAddressMode = useCallback(() => {
    setUseNewAddress(true);
    setSelectedPropertyId(null);
    setErrors((current) => ({
      ...current,
      address: undefined,
      propertyId: undefined,
    }));
  }, []);

  const handleSavedPropertySelection = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const nextPropertyId = event.currentTarget.dataset.propertyId;

      if (!nextPropertyId) {
        return;
      }

      setSelectedPropertyId(nextPropertyId);
      setErrors((current) => ({
        ...current,
        propertyId: undefined,
      }));
    },
    []
  );

  const validate = useCallback(() => {
    const nextErrors: typeof errors = {};

    if (!values.startDate || !values.endDate) {
      nextErrors.dateRange = "Choose a full date range for the visit window.";
    }

    if (
      values.startDate &&
      values.endDate &&
      values.startDate > values.endDate
    ) {
      nextErrors.dateRange =
        "The visit window must end on or after the first day.";
    }

    if (!values.preferredVisitTime) {
      nextErrors.preferredVisitTime = "Pick the best visit time.";
    }

    if (!values.serviceType) {
      nextErrors.serviceType = "Choose the service you need.";
    }

    if (useNewAddress) {
      if (!selectedAddress) {
        nextErrors.address = "Select a validated address to continue.";
      }
    } else if (!selectedPropertyId) {
      nextErrors.propertyId = "Choose a saved property to continue.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [
    selectedAddress,
    selectedPropertyId,
    useNewAddress,
    values.endDate,
    values.preferredVisitTime,
    values.serviceType,
    values.startDate,
  ]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validate()) {
        return;
      }

      const basePayload = {
        endDate: values.endDate,
        notes: values.notes || undefined,
        preferredVisitTime: values.preferredVisitTime,
        propertySize: values.propertySize
          ? (values.propertySize as "large" | "medium" | "small" | "xlarge")
          : undefined,
        serviceType: values.serviceType as
          | "cleanup"
          | "fertilization"
          | "landscaping"
          | "mowing",
        startDate: values.startDate,
      };

      const payload: QuoteIntakeInput =
        useNewAddress && selectedAddress
          ? {
              ...basePayload,
              addressLine2: values.addressLine2 || undefined,
              city: selectedAddress.city,
              formattedAddress: selectedAddress.formattedAddress,
              fullAddress: buildFullAddress({
                ...selectedAddress,
                addressLine2: values.addressLine2 || undefined,
              }),
              latitude: selectedAddress.latitude,
              longitude: selectedAddress.longitude,
              nickname: values.nickname || undefined,
              radarMetadata: selectedAddress.radarMetadata,
              radarPlaceId: selectedAddress.radarPlaceId,
              state: selectedAddress.state,
              street: selectedAddress.street,
              validationStatus: "validated",
              zip: selectedAddress.zip,
            }
          : {
              ...basePayload,
              propertyId: selectedPropertyId ?? "",
            };

      setIsSubmitting(true);

      try {
        const quoteId = await submitQuoteDraft(payload, []);
        toast.success("Estimate request submitted");
        onOpenChange(false);
        navigate({
          params: { quoteId },
          to: "/app/quotes/$quoteId",
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create estimate request"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      navigate,
      onOpenChange,
      selectedAddress,
      selectedPropertyId,
      useNewAddress,
      validate,
      values.addressLine2,
      values.endDate,
      values.nickname,
      values.notes,
      values.preferredVisitTime,
      values.propertySize,
      values.serviceType,
      values.startDate,
    ]
  );

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="w-full border-l border-black/8 bg-[#f6f4ef] p-0 text-black sm:max-w-[42rem]"
        side="right"
      >
        <SheetHeader className="border-b border-black/8 px-6 py-5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/42">
            New service request
          </p>
          <SheetTitle className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-black">
            Request another estimate without restarting onboarding.
          </SheetTitle>
          <SheetDescription className="mt-2 text-sm leading-6 text-black/55">
            Use a saved property when you can. If the job is at a new location,
            switch to a new validated address and we&apos;ll save that too.
          </SheetDescription>
        </SheetHeader>

        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <Label className="text-black/72">Visit window</Label>
              <DateRangePicker
                error={errors.dateRange}
                onChange={handleDateRangeChange}
                value={{
                  endDate: values.endDate,
                  startDate: values.startDate,
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-black/72" htmlFor="request-time-window">
                  Preferred time
                </Label>
                <select
                  className="flex h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  id="request-time-window"
                  name="preferredVisitTime"
                  onChange={handleFormValueChange}
                  value={values.preferredVisitTime}
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                {errors.preferredVisitTime ? (
                  <p className="text-sm text-rose-600">
                    {errors.preferredVisitTime}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-black/72" htmlFor="request-service-type">
                  Service type
                </Label>
                <select
                  className="flex h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  id="request-service-type"
                  name="serviceType"
                  onChange={handleFormValueChange}
                  value={values.serviceType}
                >
                  <option value="">Select a service</option>
                  {SERVICE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.serviceType ? (
                  <p className="text-sm text-rose-600">{errors.serviceType}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-black/72">Service location</Label>
                <p className="text-sm text-black/50">
                  Pick a saved property or add a new address for this request.
                </p>
              </div>

              {properties.length > 0 ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left text-sm transition",
                        useNewAddress
                          ? "border-black/10 bg-white text-black hover:border-black/20"
                          : "border-[#0a1a10] bg-[#0a1a10] text-white"
                      )}
                      onClick={openSavedPropertyMode}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2 font-medium">
                        <Home className="h-4 w-4" />
                        Use a saved property
                      </span>
                    </button>
                    <button
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left text-sm transition",
                        useNewAddress
                          ? "border-[#0a1a10] bg-[#0a1a10] text-white"
                          : "border-black/10 bg-white text-black hover:border-black/20"
                      )}
                      onClick={openNewAddressMode}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2 font-medium">
                        <Plus className="h-4 w-4" />
                        Add a new address
                      </span>
                    </button>
                  </div>

                  {useNewAddress ? null : (
                    <div className="space-y-2">
                      {properties.map((property) => {
                        const isSelected = property.id === selectedPropertyId;

                        return (
                          <button
                            className={cn(
                              "flex w-full items-start gap-3 rounded-[1.5rem] border px-4 py-4 text-left transition",
                              isSelected
                                ? "border-[#0a1a10] bg-[#eff6dd]"
                                : "border-black/10 bg-white hover:border-black/20"
                            )}
                            data-property-id={property.id}
                            key={property.id}
                            onClick={handleSavedPropertySelection}
                            type="button"
                          >
                            <MapPin
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0",
                                isSelected ? "text-[#4f7a1d]" : "text-black/38"
                              )}
                            />
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-black">
                                {property.nickname ?? "Saved property"}
                              </p>
                              <p className="text-sm text-black/58">
                                {property.fullAddress}
                              </p>
                              {property.addressLine2 ? (
                                <p className="text-xs text-black/42">
                                  {property.addressLine2}
                                </p>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                      {errors.propertyId ? (
                        <p className="text-sm text-rose-600">
                          {errors.propertyId}
                        </p>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-black/12 bg-white px-4 py-4 text-sm text-black/55">
                  No saved properties yet. Add a validated address for this
                  request and we&apos;ll save it to your account.
                </div>
              )}

              {useNewAddress ? (
                <div className="space-y-4 rounded-[1.75rem] border border-black/8 bg-white p-4">
                  <AddressAutocomplete
                    addressError={errors.address}
                    addressLine2={values.addressLine2}
                    addressLine2Label="Address Line 2"
                    onAddressLine2Change={handleAddressLine2Change}
                    onSelectionChange={handleAddressSelectionChange}
                    selectedAddress={selectedAddress}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        className="text-black/72"
                        htmlFor="request-nickname"
                      >
                        Property nickname
                      </Label>
                      <Input
                        id="request-nickname"
                        name="nickname"
                        onChange={handleFormValueChange}
                        placeholder="Home, rental, office"
                        value={values.nickname}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        className="text-black/72"
                        htmlFor="request-property-size"
                      >
                        Property size
                      </Label>
                      <select
                        className="flex h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                        id="request-property-size"
                        name="propertySize"
                        onChange={handleFormValueChange}
                        value={values.propertySize}
                      >
                        {PROPERTY_SIZE_OPTIONS.map((option) => (
                          <option
                            key={option.value || "blank"}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-black/72" htmlFor="request-notes">
                Notes for the crew
              </Label>
              <Textarea
                id="request-notes"
                name="notes"
                onChange={handleFormValueChange}
                placeholder="Access notes, gates, pets, or anything helpful before the visit."
                value={values.notes}
              />
            </div>
          </div>

          <div className="border-t border-black/8 bg-[#f6f4ef] px-6 py-4">
            <Button
              className="h-12 w-full rounded-full bg-[#0a1a10] text-white hover:bg-[#0a1a10]/92"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending request
                </>
              ) : (
                <>
                  Submit request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
