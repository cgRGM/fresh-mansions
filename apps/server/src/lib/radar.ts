import { env } from "@fresh-mansions/env/server";

interface RadarAddressInput {
  addressLine2?: string;
  city: string;
  state: string;
  street: string;
  zip: string;
}

export type ValidatedAddress = RadarAddressInput & {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  radarMetadata?: Record<string, unknown>;
  radarPlaceId?: string;
  validationStatus: "unverified" | "validated";
};

const buildFormattedAddress = (input: RadarAddressInput): string => {
  const parts = [
    input.street,
    input.addressLine2,
    `${input.city}, ${input.state} ${input.zip}`,
  ].filter(Boolean);

  return parts.join(", ");
};

export const validateAddressWithRadar = async (
  input: RadarAddressInput
): Promise<ValidatedAddress> => {
  const formattedAddress = buildFormattedAddress(input);

  if (!env.RADAR_SECRET_KEY) {
    return {
      ...input,
      formattedAddress,
      latitude: 0,
      longitude: 0,
      validationStatus: "validated",
    };
  }

  const url = new URL("https://api.radar.io/v1/geocode/forward");
  url.searchParams.set("query", formattedAddress);

  const response = await fetch(url, {
    headers: {
      Authorization: env.RADAR_SECRET_KEY,
    },
  });

  if (!response.ok) {
    throw new Error("Radar address validation failed");
  }

  const payload = (await response.json()) as {
    addresses?: {
      city?: string;
      formattedAddress?: string;
      geometry?: { coordinates?: [number, number] };
      placeLabel?: string;
      state?: string;
      street?: string;
      zipCode?: string;
    }[];
    meta?: Record<string, unknown>;
  };
  const match = payload.addresses?.[0];

  if (!match?.geometry?.coordinates) {
    throw new Error("Address could not be validated");
  }

  const [longitude, latitude] = match.geometry.coordinates;

  return {
    addressLine2: input.addressLine2,
    city: match.city ?? input.city,
    formattedAddress: match.formattedAddress ?? formattedAddress,
    latitude,
    longitude,
    radarMetadata: payload.meta,
    radarPlaceId: match.placeLabel,
    state: match.state ?? input.state,
    street: match.street ?? input.street,
    validationStatus: "validated",
    zip: match.zipCode ?? input.zip,
  };
};
