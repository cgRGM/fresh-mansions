import { db } from "@fresh-mansions/db";
import { appSetting } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const MYROUTEONLINE_API_KEY_SETTING = "myrouteonline.apiKey";

export const getMyRouteOnlineSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () => {
    const setting = await db.query.appSetting.findFirst({
      where: eq(appSetting.key, MYROUTEONLINE_API_KEY_SETTING),
    });
    const hasSavedApiKey = Boolean(setting?.value);
    let source: "missing" | "saved" = "missing";

    if (hasSavedApiKey) {
      source = "saved";
    }

    return {
      hasApiKey: hasSavedApiKey,
      source,
      updatedAt: setting?.updatedAt ?? null,
    };
  });
