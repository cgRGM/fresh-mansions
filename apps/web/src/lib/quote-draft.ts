import type { QuoteIntakeInput } from "@fresh-mansions/db/validators";
import { quoteIntakeSchema } from "@fresh-mansions/db/validators";

const QUOTE_DRAFT_STORAGE_KEY = "fresh-mansions.quote-draft";

export const clearQuoteDraft = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
};

export const loadQuoteDraft = (): null | QuoteIntakeInput => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(QUOTE_DRAFT_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const result = quoteIntakeSchema.safeParse(parsed);

    if (!result.success) {
      clearQuoteDraft();
      return null;
    }

    return result.data;
  } catch {
    clearQuoteDraft();
    return null;
  }
};

export const saveQuoteDraft = (draft: QuoteIntakeInput): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(QUOTE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};
