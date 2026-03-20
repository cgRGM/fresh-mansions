import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";

const validateAddressInputSchema = z.object({
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2),
  street: z.string().min(1),
  zip: z.string().min(5),
});

export const validateAddress = createServerFn({ method: "POST" })
  .inputValidator(validateAddressInputSchema)
  .handler(async ({ data }) => {
    const response = await apiClient.api.integrations.address.validate.$post({
      json: data,
    });

    if (!response.ok) {
      throw new Error("Unable to validate address");
    }

    const payload = (await response.json()) as {
      address: {
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
      };
    };

    return payload.address;
  });
