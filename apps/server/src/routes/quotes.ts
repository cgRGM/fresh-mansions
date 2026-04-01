import { db } from "@fresh-mansions/db";
import { buildFullAddress } from "@fresh-mansions/db/address";
import {
  customer,
  property,
  quote,
  quotePhoto,
} from "@fresh-mansions/db/schema/domain";
import type { UserRole } from "@fresh-mansions/db/validators";
import { quoteIntakeSchema } from "@fresh-mansions/db/validators";
import { env } from "@fresh-mansions/env/server";
import { and, eq } from "drizzle-orm";

import { createApp, requireSession } from "../lib/hono";
import { withPropertyFullAddress } from "../lib/quote-records";
import { requireAuth } from "../middleware/auth";

const app = createApp();

app.use("*", requireAuth);

const getAuthorizedQuote = async ({
  quoteId,
  session,
}: {
  quoteId: string;
  session: {
    appUser: { customerId: null | string; role: UserRole };
    user: { id: string };
  };
}) => {
  const quoteRecord = await db.query.quote.findFirst({
    where: eq(quote.id, quoteId),
    with: {
      customer: true,
      photos: true,
      property: true,
    },
  });

  if (!quoteRecord) {
    return null;
  }

  if (session.appUser.role === "admin") {
    return withPropertyFullAddress(quoteRecord);
  }

  if (
    !session.appUser.customerId ||
    quoteRecord.customerId !== session.appUser.customerId
  ) {
    return null;
  }

  return withPropertyFullAddress(quoteRecord);
};

const isFileEntry = (entry: File | string): entry is File =>
  typeof File !== "undefined" && entry instanceof File;

const sanitizeFilename = (value: string): string => {
  const fallback = "upload";
  const cleaned = value.trim().replaceAll(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned.length > 0 ? cleaned : fallback;
};

app.get("/", async (c) => {
  const session = requireSession(c);
  const { customerId } = session.appUser;

  if (!customerId) {
    return c.json({ quotes: [] });
  }

  const customerRecord = await db.query.customer.findFirst({
    where: eq(customer.id, customerId),
    with: {
      quotes: {
        orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
        with: {
          photos: true,
          property: true,
        },
      },
    },
  });

  return c.json({
    quotes: (customerRecord?.quotes ?? []).map((quoteRecord) =>
      withPropertyFullAddress(quoteRecord)
    ),
  });
});

app.get("/:id", async (c) => {
  const session = requireSession(c);
  const quoteId = c.req.param("id");
  const quoteRecord = await getAuthorizedQuote({
    quoteId,
    session,
  });

  if (!quoteRecord) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ quote: quoteRecord });
});

app.post("/", async (c) => {
  const session = requireSession(c);
  const userId = session.user.id;
  const body = quoteIntakeSchema.parse(await c.req.json());

  const customerRecord = await db.query.customer.findFirst({
    where: eq(customer.userId, userId),
  });
  let customerId = customerRecord?.id ?? session.appUser.customerId;

  if (!customerId) {
    customerId = crypto.randomUUID();
    await db.insert(customer).values({
      id: customerId,
      phone: body.phone ?? null,
      userId,
    });
  }

  const propertyId = crypto.randomUUID();
  const fullAddress = buildFullAddress({
    addressLine2: body.addressLine2,
    city: body.city,
    formattedAddress: body.fullAddress || body.formattedAddress,
    state: body.state,
    street: body.street,
    zip: body.zip,
  });
  await db.insert(property).values({
    addressLine2: body.addressLine2 ?? null,
    addressValidationStatus: body.validationStatus,
    city: body.city,
    customerId,
    formattedAddress: fullAddress || body.formattedAddress || null,
    id: propertyId,
    latitude: body.latitude,
    longitude: body.longitude,
    nickname: body.nickname ?? null,
    radarMetadata: body.radarMetadata ?? null,
    radarPlaceId: body.radarPlaceId ?? null,
    state: body.state,
    street: body.street,
    zip: body.zip,
  });

  const quoteId = crypto.randomUUID();
  await db.insert(quote).values({
    customerId,
    id: quoteId,
    notes: body.notes ?? null,
    preferredEndDate: body.endDate ?? null,
    preferredStartDate: body.startDate ?? null,
    preferredVisitTime: body.preferredVisitTime ?? null,
    propertyId,
    propertySize: body.propertySize ?? null,
    serviceType: body.serviceType,
    status: "requested",
  });

  return c.json({ fullAddress, quoteId }, 201);
});

app.post("/:id/photos", async (c) => {
  const session = requireSession(c);
  const quoteId = c.req.param("id");
  const quoteRecord = await getAuthorizedQuote({
    quoteId,
    session,
  });

  if (!quoteRecord) {
    return c.json({ error: "Not found" }, 404);
  }

  const formData = await c.req.formData();
  const entries = formData.getAll("photos");
  const photosToInsert: {
    filename: string | null;
    id: string;
    quoteId: string;
    url: string;
  }[] = [];

  for (const entry of entries) {
    if (!isFileEntry(entry) || entry.size === 0) {
      continue;
    }

    const photoId = crypto.randomUUID();
    const filename = sanitizeFilename(entry.name);
    const storageKey = `quotes/${quoteId}/${photoId}-${filename}`;

    await env.STORAGE.put(storageKey, entry, {
      httpMetadata: {
        contentType: entry.type || "application/octet-stream",
      },
    });

    photosToInsert.push({
      filename,
      id: photoId,
      quoteId,
      url: storageKey,
    });
  }

  if (photosToInsert.length === 0) {
    return c.json({ photos: [] }, 201);
  }

  await db.insert(quotePhoto).values(photosToInsert);

  return c.json({ photos: photosToInsert }, 201);
});

app.get("/:quoteId/photos/:photoId", async (c) => {
  const session = requireSession(c);
  const quoteId = c.req.param("quoteId");
  const photoId = c.req.param("photoId");
  const quoteRecord = await getAuthorizedQuote({
    quoteId,
    session,
  });

  if (!quoteRecord) {
    return c.json({ error: "Not found" }, 404);
  }

  const photoRecord = await db.query.quotePhoto.findFirst({
    where: and(eq(quotePhoto.id, photoId), eq(quotePhoto.quoteId, quoteId)),
  });

  if (!photoRecord) {
    return c.json({ error: "Photo not found" }, 404);
  }

  const object = await env.STORAGE.get(photoRecord.url);

  if (!object?.body) {
    return c.json({ error: "Photo not found" }, 404);
  }

  return new Response(object.body, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type":
        object.httpMetadata?.contentType || "application/octet-stream",
    },
  });
});

export default app;
