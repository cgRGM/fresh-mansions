import { env } from "@fresh-mansions/env/web";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { Textarea } from "@fresh-mansions/ui/components/textarea";
import {
  createFileRoute,
  getRouteApi,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { ImagePlus, UploadCloud } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import * as zod from "zod";

import { QuoteStepLayout } from "@/components/quote/quote-step-layout";
import { createQuoteIntake } from "@/functions/create-quote-intake";
import { getUser } from "@/functions/get-user";
import { validateAddress } from "@/functions/validate-address";

const onboardingSearchSchema = zod.object({
  endDate: zod.string(),
  phone: zod.string().optional(),
  preferredVisitTime: zod.string(),
  startDate: zod.string(),
});

const onboardingSchema = zod.object({
  addressLine2: zod.string().optional(),
  city: zod.string().min(1, "City is required"),
  nickname: zod.string().optional(),
  notes: zod.string().optional(),
  propertySize: zod.string().optional(),
  serviceType: zod.string().min(1, "Choose a service type"),
  state: zod.string().min(2, "State is required"),
  street: zod.string().min(1, "Street address is required"),
  zip: zod.string().min(5, "ZIP code is required"),
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

const uploadQuotePhotos = async (
  files: File[],
  quoteId: string
): Promise<void> => {
  if (files.length === 0) {
    return;
  }

  const formData = new FormData();

  for (const file of files) {
    formData.append("photos", file);
  }

  const response = await fetch(
    `${env.VITE_SERVER_URL}/api/quotes/${quoteId}/photos`,
    {
      body: formData,
      credentials: "include",
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload photos");
  }
};

const OnboardingStep = () => {
  const navigate = useNavigate();
  const search = onboardingRouteApi.useSearch();
  const [files, setFiles] = useState<File[]>([]);
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
  const [formValues, setFormValues] = useState({
    addressLine2: "",
    city: "",
    nickname: "",
    notes: "",
    propertySize: "",
    serviceType: "",
    state: "",
    street: "",
    zip: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formValues, string>>
  >({});
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
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
      if (["addressLine2", "city", "state", "street", "zip"].includes(name)) {
        setValidatedAddress(null);
      }
    },
    []
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFiles([...(event.target.files ?? [])]);
    },
    []
  );

  const handleValidateAddress = useCallback(async () => {
    const parsed = onboardingSchema
      .pick({
        addressLine2: true,
        city: true,
        state: true,
        street: true,
        zip: true,
      })
      .safeParse(formValues);

    if (!parsed.success) {
      const { fieldErrors } = parsed.error.flatten();
      setErrors((current) => ({
        ...current,
        city: fieldErrors.city?.[0] ?? current.city,
        state: fieldErrors.state?.[0] ?? current.state,
        street: fieldErrors.street?.[0] ?? current.street,
        zip: fieldErrors.zip?.[0] ?? current.zip,
      }));
      return;
    }

    setIsValidatingAddress(true);

    try {
      const address = await validateAddress({
        data: parsed.data,
      });

      setValidatedAddress(address);
      setFormValues((current) => ({
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
  }, [formValues]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const parsed = onboardingSchema.safeParse(formValues);

      if (!parsed.success) {
        const { fieldErrors } = parsed.error.flatten();
        setErrors({
          city: fieldErrors.city?.[0],
          serviceType: fieldErrors.serviceType?.[0],
          state: fieldErrors.state?.[0],
          street: fieldErrors.street?.[0],
          zip: fieldErrors.zip?.[0],
        });
        return;
      }

      if (!validatedAddress) {
        toast.error("Validate the property address before submitting");
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await createQuoteIntake({
          data: {
            addressLine2: parsed.data.addressLine2 || undefined,
            city: parsed.data.city,
            endDate: search.endDate,
            formattedAddress: validatedAddress.formattedAddress,
            latitude: validatedAddress.latitude,
            longitude: validatedAddress.longitude,
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
            radarMetadata: validatedAddress.radarMetadata,
            radarPlaceId: validatedAddress.radarPlaceId,
            serviceType: parsed.data.serviceType as
              | "cleanup"
              | "fertilization"
              | "landscaping"
              | "mowing",
            startDate: search.startDate,
            state: parsed.data.state,
            street: parsed.data.street,
            validationStatus: validatedAddress.validationStatus,
            zip: parsed.data.zip,
          },
        });

        await uploadQuotePhotos(files, result.quoteId);

        toast.success("Estimate visit requested");
        navigate({
          search: {
            quoteId: result.quoteId,
          },
          to: "/app/dashboard",
        });
      } catch {
        toast.error("Failed to submit estimate request");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      files,
      formValues,
      navigate,
      search.endDate,
      search.phone,
      search.preferredVisitTime,
      search.startDate,
      validatedAddress,
    ]
  );

  return (
    <QuoteStepLayout
      description="Add your address, describe the work you need, and share any photos that help our team prepare for the visit."
      step="Step 3 of 3"
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
            <div className="space-y-2">
              <Label className="text-black/72" htmlFor="street">
                Street Address
              </Label>
              <Input
                className="h-12 rounded-2xl border-black/10 bg-white"
                id="street"
                name="street"
                onChange={handleChange}
                placeholder="123 Main Street"
                value={formValues.street}
              />
              {errors.street ? (
                <p className="text-sm text-rose-600">{errors.street}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-black/72" htmlFor="addressLine2">
                Address Line 2
              </Label>
              <Input
                className="h-12 rounded-2xl border-black/10 bg-white"
                id="addressLine2"
                name="addressLine2"
                onChange={handleChange}
                placeholder="Suite, gate code, or unit"
                value={formValues.addressLine2}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-black/8 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-black">
                  Validate the service address with Radar
                </p>
                <p className="text-sm text-black/55">
                  We use the normalized address and coordinates to set up
                  routing later.
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

            <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
              <div className="space-y-2">
                <Label className="text-black/72" htmlFor="city">
                  City
                </Label>
                <Input
                  className="h-12 rounded-2xl border-black/10 bg-white"
                  id="city"
                  name="city"
                  onChange={handleChange}
                  placeholder="Harrisonburg"
                  value={formValues.city}
                />
                {errors.city ? (
                  <p className="text-sm text-rose-600">{errors.city}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-black/72" htmlFor="state">
                  State
                </Label>
                <Input
                  className="h-12 rounded-2xl border-black/10 bg-white"
                  id="state"
                  name="state"
                  onChange={handleChange}
                  placeholder="VA"
                  value={formValues.state}
                />
                {errors.state ? (
                  <p className="text-sm text-rose-600">{errors.state}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-black/72" htmlFor="zip">
                  ZIP
                </Label>
                <Input
                  className="h-12 rounded-2xl border-black/10 bg-white"
                  id="zip"
                  name="zip"
                  onChange={handleChange}
                  placeholder="22801"
                  value={formValues.zip}
                />
                {errors.zip ? (
                  <p className="text-sm text-rose-600">{errors.zip}</p>
                ) : null}
              </div>
            </div>
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
            {isSubmitting ? "Submitting request..." : "Submit estimate request"}
          </Button>
        </form>
      </div>
    </QuoteStepLayout>
  );
};

export const Route = createFileRoute("/get-quote/onboarding")({
  beforeLoad: async ({ search }) => {
    const user = await getUser();

    if (!user) {
      throw redirect({
        search,
        to: "/get-quote/login",
      });
    }
  },
  component: OnboardingStep,
  validateSearch: onboardingSearchSchema,
});
