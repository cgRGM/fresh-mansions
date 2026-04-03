import { db } from "@fresh-mansions/db";
import { service } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const deleteService = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    await db.delete(service).where(eq(service.id, data.id));
    return { ok: true };
  });
