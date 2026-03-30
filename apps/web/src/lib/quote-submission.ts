import type { QuoteIntakeInput } from "@fresh-mansions/db/validators";

import { apiClient, getQuotePhotosUploadUrl } from "@/lib/api-client";

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

  const response = await fetch(getQuotePhotosUploadUrl(quoteId), {
    body: formData,
    credentials: "include",
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to upload photos");
  }
};

export const submitQuoteDraft = async (
  draft: QuoteIntakeInput,
  files: File[]
): Promise<string> => {
  const response = await apiClient.api.quotes.$post({
    json: draft,
  });

  if (!response.ok) {
    throw new Error("Failed to create estimate request");
  }

  const result = await response.json();
  await uploadQuotePhotos(files, result.quoteId);

  return result.quoteId;
};
