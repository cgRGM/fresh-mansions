import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const customer = sqliteTable(
  "customer",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    phone: text("phone"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
  },
  (table) => [index("customer_userId_idx").on(table.userId)]
);

export const property = sqliteTable(
  "property",
  {
    addressLine2: text("address_line_2"),
    addressSource: text("address_source").notNull().default("manual"),
    addressValidationStatus: text("address_validation_status")
      .notNull()
      .default("unverified"),
    city: text("city").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    formattedAddress: text("formatted_address"),
    id: text("id").primaryKey(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    nickname: text("nickname"),
    radarMetadata: text("radar_metadata", { mode: "json" }),
    radarPlaceId: text("radar_place_id"),
    state: text("state").notNull(),
    street: text("street").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
    zip: text("zip").notNull(),
  },
  (table) => [index("property_customerId_idx").on(table.customerId)]
);

export const quote = sqliteTable(
  "quote",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    finalPrice: integer("final_price"),
    id: text("id").primaryKey(),
    notes: text("notes"),
    preferredEndDate: text("preferred_end_date"),
    preferredStartDate: text("preferred_start_date"),
    preferredVisitTime: text("preferred_visit_time"),
    propertyId: text("property_id")
      .notNull()
      .references(() => property.id, { onDelete: "cascade" }),
    propertySize: text("property_size"),
    proposedWorkDate: text("proposed_work_date"),
    quotedAt: integer("quoted_at", { mode: "timestamp_ms" }),
    scheduledVisitAt: integer("scheduled_visit_at", { mode: "timestamp_ms" }),
    serviceType: text("service_type").notNull(),
    status: text("status").notNull().default("requested"),
    timePreference: text("time_preference"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("quote_customerId_idx").on(table.customerId),
    index("quote_propertyId_idx").on(table.propertyId),
  ]
);

export const quotePhoto = sqliteTable(
  "quote_photo",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    filename: text("filename"),
    id: text("id").primaryKey(),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quote.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
  },
  (table) => [index("quotePhoto_quoteId_idx").on(table.quoteId)]
);

export const contractor = sqliteTable(
  "contractor",
  {
    chargesEnabled: integer("charges_enabled", { mode: "boolean" })
      .default(false)
      .notNull(),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    displayName: text("display_name").notNull(),
    id: text("id").primaryKey(),
    onboardingCompletedAt: integer("onboarding_completed_at", {
      mode: "timestamp_ms",
    }),
    payoutsEnabled: integer("payouts_enabled", { mode: "boolean" })
      .default(false)
      .notNull(),
    status: text("status").notNull().default("active"),
    stripeAccountId: text("stripe_account_id"),
    stripeAccountStatus: text("stripe_account_status")
      .notNull()
      .default("not_started"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
  },
  (table) => [index("contractor_userId_idx").on(table.userId)]
);

export const workOrder = sqliteTable(
  "work_order",
  {
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    contractorId: text("contractor_id").references(() => contractor.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    notes: text("notes"),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quote.id, { onDelete: "cascade" }),
    scheduledDate: text("scheduled_date"),
    status: text("status").notNull().default("pending"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("workOrder_quoteId_idx").on(table.quoteId),
    index("workOrder_contractorId_idx").on(table.contractorId),
  ]
);

export const route = sqliteTable(
  "route",
  {
    color: text("color").notNull().default("0x0a1a10"),
    contractorId: text("contractor_id").references(() => contractor.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    routeDate: text("route_date").notNull(),
    status: text("status").notNull().default("draft"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("route_contractorId_idx").on(table.contractorId),
    index("route_routeDate_idx").on(table.routeDate),
  ]
);

export const routeStop = sqliteTable(
  "route_stop",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    notes: text("notes"),
    propertyId: text("property_id").references(() => property.id, {
      onDelete: "set null",
    }),
    routeId: text("route_id")
      .notNull()
      .references(() => route.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    status: text("status").notNull().default("pending"),
    workOrderId: text("work_order_id").references(() => workOrder.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    index("routeStop_routeId_idx").on(table.routeId),
    index("routeStop_workOrderId_idx").on(table.workOrderId),
    index("routeStop_propertyId_idx").on(table.propertyId),
  ]
);

export const service = sqliteTable("service", {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  description: text("description"),
  id: text("id").primaryKey(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").default(0).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const invoice = sqliteTable(
  "invoice",
  {
    amountDue: integer("amount_due").notNull(),
    amountPaid: integer("amount_paid").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    currency: text("currency").notNull().default("usd"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    dueDate: text("due_date"),
    hostedInvoiceUrl: text("hosted_invoice_url"),
    id: text("id").primaryKey(),
    note: text("note"),
    status: text("status").notNull().default("draft"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeInvoiceId: text("stripe_invoice_id"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
    workOrderId: text("work_order_id").references(() => workOrder.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("invoice_customerId_idx").on(table.customerId),
    index("invoice_workOrderId_idx").on(table.workOrderId),
  ]
);

export const subscription = sqliteTable(
  "subscription",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    currency: text("currency").notNull().default("usd"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    interval: text("interval").notNull().default("month"),
    intervalCount: integer("interval_count").notNull().default(1),
    nickname: text("nickname"),
    priceCents: integer("price_cents").notNull(),
    status: text("status").notNull().default("draft"),
    stripeCustomerId: text("stripe_customer_id"),
    stripePriceId: text("stripe_price_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("subscription_customerId_idx").on(table.customerId)]
);

export const stripeEvent = sqliteTable("stripe_event", {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  eventType: text("event_type").notNull(),
  id: text("id").primaryKey(),
  livemode: integer("livemode", { mode: "boolean" }).default(false).notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  processedAt: integer("processed_at", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("received"),
  stripeCreatedAt: integer("stripe_created_at", { mode: "timestamp_ms" }),
  stripeEventId: text("stripe_event_id").notNull().unique(),
});

// Relations

export const customerRelations = relations(customer, ({ one, many }) => ({
  invoices: many(invoice),
  properties: many(property),
  quotes: many(quote),
  subscriptions: many(subscription),
  user: one(user, {
    fields: [customer.userId],
    references: [user.id],
  }),
}));

export const propertyRelations = relations(property, ({ one, many }) => ({
  customer: one(customer, {
    fields: [property.customerId],
    references: [customer.id],
  }),
  quotes: many(quote),
}));

export const quoteRelations = relations(quote, ({ one, many }) => ({
  customer: one(customer, {
    fields: [quote.customerId],
    references: [customer.id],
  }),
  photos: many(quotePhoto),
  property: one(property, {
    fields: [quote.propertyId],
    references: [property.id],
  }),
  workOrders: many(workOrder),
}));

export const quotePhotoRelations = relations(quotePhoto, ({ one }) => ({
  quote: one(quote, {
    fields: [quotePhoto.quoteId],
    references: [quote.id],
  }),
}));

export const workOrderRelations = relations(workOrder, ({ one }) => ({
  contractor: one(contractor, {
    fields: [workOrder.contractorId],
    references: [contractor.id],
  }),
  invoice: one(invoice, {
    fields: [workOrder.id],
    references: [invoice.workOrderId],
  }),
  quote: one(quote, {
    fields: [workOrder.quoteId],
    references: [quote.id],
  }),
}));

export const contractorRelations = relations(contractor, ({ one, many }) => ({
  routes: many(route),
  user: one(user, {
    fields: [contractor.userId],
    references: [user.id],
  }),
  workOrders: many(workOrder),
}));

export const routeRelations = relations(route, ({ one, many }) => ({
  contractor: one(contractor, {
    fields: [route.contractorId],
    references: [contractor.id],
  }),
  stops: many(routeStop),
}));

export const routeStopRelations = relations(routeStop, ({ one }) => ({
  property: one(property, {
    fields: [routeStop.propertyId],
    references: [property.id],
  }),
  route: one(route, {
    fields: [routeStop.routeId],
    references: [route.id],
  }),
  workOrder: one(workOrder, {
    fields: [routeStop.workOrderId],
    references: [workOrder.id],
  }),
}));

export const invoiceRelations = relations(invoice, ({ one }) => ({
  customer: one(customer, {
    fields: [invoice.customerId],
    references: [customer.id],
  }),
  workOrder: one(workOrder, {
    fields: [invoice.workOrderId],
    references: [workOrder.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  customer: one(customer, {
    fields: [subscription.customerId],
    references: [customer.id],
  }),
}));
