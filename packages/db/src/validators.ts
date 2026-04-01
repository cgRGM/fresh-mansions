import * as zod from "zod";

export const userRoleEnum = zod.enum([
  "customer",
  "admin",
  "contractor",
  "super_user",
]);
export type UserRole = zod.infer<typeof userRoleEnum>;

export const serviceTypeEnum = zod.enum([
  "mowing",
  "landscaping",
  "cleanup",
  "fertilization",
]);
export type ServiceType = zod.infer<typeof serviceTypeEnum>;

export const propertySizeEnum = zod.enum([
  "small",
  "medium",
  "large",
  "xlarge",
]);
export type PropertySize = zod.infer<typeof propertySizeEnum>;

export const preferredVisitWindowEnum = zod.enum([
  "early_morning",
  "morning",
  "afternoon",
  "late_afternoon",
]);
export type PreferredVisitWindow = zod.infer<typeof preferredVisitWindowEnum>;

export const preferredVisitTimeSchema = zod.union([
  preferredVisitWindowEnum,
  zod
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please choose a valid visit time"),
]);
export type PreferredVisitTime = zod.infer<typeof preferredVisitTimeSchema>;

export const quoteStatusEnum = zod.enum([
  "requested",
  "visit_scheduled",
  "quote_ready",
  "approved",
  "rejected",
  "converted",
]);
export type QuoteStatus = zod.infer<typeof quoteStatusEnum>;

export const workOrderStatusEnum = zod.enum([
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
]);
export type WorkOrderStatus = zod.infer<typeof workOrderStatusEnum>;

export const addressValidationStatusEnum = zod.enum([
  "validated",
  "unverified",
  "invalid",
]);
export type AddressValidationStatus = zod.infer<
  typeof addressValidationStatusEnum
>;

export const stripeAccountStatusEnum = zod.enum([
  "not_started",
  "pending",
  "restricted",
  "active",
]);
export type StripeAccountStatus = zod.infer<typeof stripeAccountStatusEnum>;

export const routeStatusEnum = zod.enum([
  "draft",
  "ready",
  "in_progress",
  "completed",
]);
export type RouteStatus = zod.infer<typeof routeStatusEnum>;

export const routeStopStatusEnum = zod.enum([
  "pending",
  "en_route",
  "arrived",
  "completed",
  "skipped",
]);
export type RouteStopStatus = zod.infer<typeof routeStopStatusEnum>;

export const invoiceStatusEnum = zod.enum([
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]);
export type InvoiceStatus = zod.infer<typeof invoiceStatusEnum>;

export const subscriptionStatusEnum = zod.enum([
  "draft",
  "active",
  "past_due",
  "cancelled",
  "incomplete",
]);
export type SubscriptionStatus = zod.infer<typeof subscriptionStatusEnum>;

export const addressSchema = zod.object({
  addressLine2: zod.string().optional(),
  city: zod.string().min(1, "City is required"),
  formattedAddress: zod.string().optional(),
  fullAddress: zod.string().optional(),
  latitude: zod.number().optional(),
  longitude: zod.number().optional(),
  radarMetadata: zod.record(zod.string(), zod.unknown()).optional(),
  radarPlaceId: zod.string().optional(),
  state: zod.string().min(2, "State is required"),
  street: zod.string().min(1, "Street address is required"),
  zip: zod.string().min(5, "ZIP code is required"),
});

export const validatedAddressSchema = addressSchema.extend({
  validationStatus: addressValidationStatusEnum,
});

const dateWindowSchema = zod
  .object({
    endDate: zod.string().optional(),
    startDate: zod.string().optional(),
  })
  .refine(
    ({ endDate, startDate }) => {
      if (!startDate || !endDate) {
        return true;
      }

      return new Date(startDate).getTime() <= new Date(endDate).getTime();
    },
    {
      message: "The visit window must end on or after the start date",
      path: ["endDate"],
    }
  );

export const scheduleSearchSchema = dateWindowSchema.extend({
  phone: zod.string().optional(),
  preferredVisitTime: preferredVisitTimeSchema.optional(),
});

export const quoteIntakeSchema = dateWindowSchema
  .extend({
    addressLine2: zod.string().optional(),
    city: zod.string().min(1, "City is required"),
    formattedAddress: zod.string().optional(),
    fullAddress: zod.string().min(1, "A validated full address is required"),
    latitude: zod.number(),
    longitude: zod.number(),
    nickname: zod.string().optional(),
    notes: zod.string().optional(),
    phone: zod.string().optional(),
    preferredVisitTime: preferredVisitTimeSchema,
    propertySize: propertySizeEnum.optional(),
    radarMetadata: zod.record(zod.string(), zod.unknown()).optional(),
    radarPlaceId: zod.string().optional(),
    serviceType: serviceTypeEnum,
    state: zod.string().min(2, "State is required"),
    street: zod.string().min(1, "Street address is required"),
    validationStatus: zod.literal("validated"),
    zip: zod.string().min(5, "ZIP code is required"),
  })
  .refine(({ endDate }) => Boolean(endDate), {
    message: "End date is required",
    path: ["endDate"],
  })
  .refine(({ startDate }) => Boolean(startDate), {
    message: "Start date is required",
    path: ["startDate"],
  });
export type QuoteIntakeInput = zod.infer<typeof quoteIntakeSchema>;

export const customerBackfillSchema = zod
  .object({
    addressLine2: zod.string().optional(),
    city: zod.string().optional(),
    email: zod.email(),
    formattedAddress: zod.string().optional(),
    latitude: zod.number().optional(),
    longitude: zod.number().optional(),
    name: zod.string().min(2),
    nickname: zod.string().optional(),
    phone: zod.string().optional(),
    radarMetadata: zod.record(zod.string(), zod.unknown()).optional(),
    radarPlaceId: zod.string().optional(),
    state: zod.string().optional(),
    street: zod.string().optional(),
    validationStatus: addressValidationStatusEnum.default("unverified"),
    zip: zod.string().optional(),
  })
  .refine(
    (value) => {
      const hasAddress = [
        value.street,
        value.city,
        value.state,
        value.zip,
      ].some(Boolean);

      if (!hasAddress) {
        return true;
      }

      return Boolean(value.street && value.city && value.state && value.zip);
    },
    {
      message: "If you add a property, complete the full address",
      path: ["street"],
    }
  );

export const contractorInviteSchema = zod.object({
  contactEmail: zod.email(),
  contactPhone: zod.string().optional(),
  displayName: zod.string().min(2),
  notes: zod.string().optional(),
});

export const workOrderAssignmentSchema = zod.object({
  contractorId: zod.string(),
  routeId: zod.string().optional(),
  scheduledDate: zod.string().optional(),
  workOrderId: zod.string(),
});

export const routeUpsertSchema = zod.object({
  contractorId: zod.string().optional(),
  name: zod.string().min(2),
  routeDate: zod.string().min(1),
  status: routeStatusEnum.default("draft"),
});

export const routeStopUpsertSchema = zod.object({
  notes: zod.string().optional(),
  routeId: zod.string(),
  sequence: zod.number().int().nonnegative(),
  status: routeStopStatusEnum.default("pending"),
  workOrderId: zod.string(),
});

export const invoiceCreateSchema = zod.object({
  amountDue: zod.number().int().positive(),
  currency: zod.string().default("usd"),
  customerId: zod.string(),
  dueDate: zod.string().optional(),
  note: zod.string().optional(),
  workOrderId: zod.string().optional(),
});

export const subscriptionCreateSchema = zod.object({
  currency: zod.string().default("usd"),
  customerId: zod.string(),
  interval: zod.enum(["month", "week"]).default("month"),
  intervalCount: zod.number().int().positive().default(1),
  nickname: zod.string().optional(),
  priceCents: zod.number().int().positive(),
});
