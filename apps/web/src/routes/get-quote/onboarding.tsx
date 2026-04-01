import { buildFullAddress } from "@fresh-mansions/db/address";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { Textarea } from "@fresh-mansions/ui/components/textarea";
import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from "@tanstack/react-router";
import { ImagePlus, UploadCloud } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import * as zod from "zod";

import { AddressAutocomplete } from "@/components/quote/address-autocomplete";
import type { QuoteAddressSelection } from "@/components/quote/address-autocomplete";
import { useQuoteFlow } from "@/components/quote/quote-flow-context";
import { QuoteStepLayout } from "@/components/quote/quote-step-layout";
import { saveQuoteDraft } from "@/lib/quote-draft";

const onboardingSearchSchema = zod.object({
  endDate: zod.string(),
  phone: zod.string().optional(),
  preferredVisitTime: zod.string(),
  startDate: zod.string(),
});

const onboardingSchema = zod.object({
  addressLine2: zod.string().optional(),
  nickname: zod.string().optional(),
  notes: zod.string().optional(),
  propertySize: zod.string().optional(),
  serviceType: zod.string().min(1, "Choose a service type"),
});

const serviceTypeOptions = [
  {
    description: "Weekly or bi-weekly lawn maintenance",
    label: "Mowing",
    value: "mowing",
  },
  {
    description: "Beds, borders, and larger outdoor projects",
    label: "Landscaping",
    value: "landscaping",
  },
  {
    description: "Leaves, debris, and overgrowth removal",
    label: "Cleanup",
    value: "cleanup",
  },
  {
    description: "Feeding plans and turf health support",
    label: "Fertilization",
    value: "fertilization",
  },
] as const;

const propertySizeOptions = [
  { label: "Not sure yet", value: "" },
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
  { label: "X-Large", value: "xlarge" },
] as const;
const onboardingRouteApi = getRouteApi("/get-quote/onboarding");

const OnboardingStep = () => {
  const navigate = useNavigate();
  const search = onboardingRouteApi.useSearch();
  const { setFiles } = useQuoteFlow();
  const [files, setLocalFiles] = useState<File[]>([]);
  const [selectedAddress, setSelectedAddress] =
    useState<null | QuoteAddressSelection>(null);
  const [formValues, setFormValues] = useState({
    addressLine2: "",
    nickname: "",
    notes: "",
    propertySize: "",
    serviceType: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formValues, string>> & { address?: string }
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = event.target;

      setFormValues((current) => ({
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

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setLocalFiles([...(event.target.files ?? [])]);
    },
    []
  );

  const handleAddressLine2Change = useCallback((value: string) => {
    setFormValues((current) => ({
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

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const parsed = onboardingSchema.safeParse(formValues);

      if (!parsed.success) {
        const { fieldErrors } = parsed.error.flatten();
        setErrors({
          serviceType: fieldErrors.serviceType?.[0],
        });
        return;
      }

      if (!selectedAddress) {
        setErrors((current) => ({
          ...current,
          address: "Select a valid service address to continue",
        }));
        toast.error("Select a valid service address before continuing");
        return;
      }

      setIsSubmitting(true);

      try {
        const fullAddress = buildFullAddress({
          ...selectedAddress,
          addressLine2: parsed.data.addressLine2,
        });

        saveQuoteDraft({
          addressLine2: parsed.data.addressLine2 || undefined,
          city: selectedAddress.city,
          endDate: search.endDate,
          formattedAddress: selectedAddress.formattedAddress,
          fullAddress,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          nickname: parsed.data.nickname || undefined,
          notes: parsed.data.notes || undefined,
          phone: search.phone || undefined,
          preferredVisitTime: search.preferredVisitTime,
          propertySize: parsed.data.propertySize
            ? (parsed.data.propertySize as
                | "large"
                | "medium"
                | "small"
                | "xlarge")
            : undefined,
          radarMetadata: selectedAddress.radarMetadata,
          radarPlaceId: selectedAddress.radarPlaceId,
          serviceType: parsed.data.serviceType as
            | "cleanup"
            | "fertilization"
            | "landscaping"
            | "mowing",
          startDate: search.startDate,
          state: selectedAddress.state,
          street: selectedAddress.street,
          validationStatus: "validated",
          zip: selectedAddress.zip,
        });
        setFiles(files);
        navigate({
          search,
          to: "/get-quote/signup",
        });
      } catch {
        toast.error("Failed to save estimate details");
      } finally {
        setIsSubmitting(false);
      }
    },
    [files, formValues, navigate, search, selectedAddress, setFiles]
  );

  return (
    <QuoteStepLayout
      description="Add your address, describe the work you need, and share any photos that help our team prepare for the visit. We'll create your account on the next step."
      step="Step 2 of 3"
      title="Tell us about your property."
    >
      <div className="rounded-[2rem] border border-white/10 bg-[#f6f4ef] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.20)] sm:p-8">
        <div className="mb-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-black/45">
            Property and service details
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-black">
            Give the crew the context they need before they arrive.
          </h2>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <AddressAutocomplete
              addressError={errors.address}
              addressLine2={formValues.addressLine2}
              onAddressLine2Change={handleAddressLine2Change}
              onSelectionChange={handleAddressSelectionChange}
              selectedAddress={selectedAddress}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-black/72" htmlFor="serviceType">
                Service Type
              </Label>
              <select
                className="flex h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                id="serviceType"
                name="serviceType"
                onChange={handleChange}
                value={formValues.serviceType}
              >
                <option value="">Select a service</option>
                {serviceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
              {errors.serviceType ? (
                <p className="text-sm text-rose-600">{errors.serviceType}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-black/72" htmlFor="propertySize">
                Property Size
              </Label>
              <select
                className="flex h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                id="propertySize"
                name="propertySize"
                onChange={handleChange}
                value={formValues.propertySize}
              >
                {propertySizeOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-2">
              <Label className="text-black/72" htmlFor="nickname">
                Property Nickname
              </Label>
              <Input
                className="h-12 rounded-2xl border-black/10 bg-white"
                id="nickname"
                name="nickname"
                onChange={handleChange}
                placeholder="Home, rental, office"
                value={formValues.nickname}
              />
            </div>

            <div className="rounded-[1.75rem] border border-black/8 bg-white px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/45">
                Requested window
              </p>
              <p className="mt-3 text-base font-semibold text-black">
                {new Date(search.startDate).toLocaleDateString()} to{" "}
                {new Date(search.endDate).toLocaleDateString()}
              </p>
              <p className="mt-1 text-sm text-black/55">
                Preferred arrival: {search.preferredVisitTime}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-black/72" htmlFor="notes">
              Notes
            </Label>
            <Textarea
              className="min-h-28 rounded-[1.5rem] border-black/10 bg-white"
              id="notes"
              name="notes"
              onChange={handleChange}
              placeholder="Access instructions, pet notes, problem areas, or anything else the crew should know before the visit."
              value={formValues.notes}
            />
          </div>

          <div className="rounded-[1.75rem] border border-dashed border-black/12 bg-white p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-black p-3 text-white">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-black">
                  Optional photos
                </p>
                <p className="mt-1 text-sm leading-6 text-black/55">
                  Upload a few images if the property has access issues,
                  overgrowth, drainage, or anything else you want the estimator
                  to see before arrival.
                </p>
                <label
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-black px-4 py-2 text-sm font-medium text-white"
                  htmlFor="quote-photo-upload"
                >
                  <UploadCloud className="h-4 w-4" />
                  Add photos
                </label>
                <input
                  accept="image/*"
                  className="sr-only"
                  id="quote-photo-upload"
                  multiple
                  onChange={handleFileChange}
                  type="file"
                />
                {files.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm text-black/60">
                    {files.map((file) => (
                      <li key={`${file.name}-${file.size}`}>{file.name}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <Button
            className="h-12 w-full rounded-full bg-black text-white hover:bg-black/90"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving details..." : "Continue to account"}
          </Button>
        </form>
      </div>
    </QuoteStepLayout>
  );
};

export const Route = createFileRoute("/get-quote/onboarding")({
  component: OnboardingStep,
  validateSearch: onboardingSearchSchema,
});
