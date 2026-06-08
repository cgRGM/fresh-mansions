import { db } from "@fresh-mansions/db";
import { appSetting } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const MYROUTEONLINE_API_KEY_SETTING = "myrouteonline.apiKey";

const updateMyRouteOnlineSettingsSchema = z.object({
  apiKey: z.string().trim().min(8, "Enter a valid MyRouteOnline API key"),
});

export const updateMyRouteOnlineSettings = createServerFn({ method: "POST" })
  .inputValidator(updateMyRouteOnlineSettingsSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    const existingSetting = await db.query.appSetting.findFirst({
      where: eq(appSetting.key, MYROUTEONLINE_API_KEY_SETTING),
    });

    await (existingSetting
      ? db
          .update(appSetting)
          .set({
            value: data.apiKey,
          })
          .where(eq(appSetting.key, MYROUTEONLINE_API_KEY_SETTING))
      : db.insert(appSetting).values({
          key: MYROUTEONLINE_API_KEY_SETTING,
          value: data.apiKey,
        }));

    return { ok: true };
  });
