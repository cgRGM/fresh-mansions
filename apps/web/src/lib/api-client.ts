import { env } from "@fresh-mansions/env/web";
import { hc } from "hono/client";

import type { AppType } from "../../../server/src/app";

export const apiClient = hc<AppType>(env.VITE_SERVER_URL, {
  init: {
    credentials: "include",
  },
});

export const getQuotePhotoUrl = (photoId: string, quoteId: string): string =>
  apiClient.api.quotes[":quoteId"].photos[":photoId"]
    .$url({
      param: {
        photoId,
        quoteId,
      },
    })
    .toString();

export const getQuotePhotosUploadUrl = (quoteId: string): string =>
  apiClient.api.quotes[":id"].photos
    .$url({
      param: {
        id: quoteId,
      },
    })
    .toString();
