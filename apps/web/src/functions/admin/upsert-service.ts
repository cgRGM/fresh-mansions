import { db } from "@fresh-mansions/db";
import { service } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

const upsertServiceSchema = z.object({
  description: z.string().optional(),
  id: z.string().optional(),
  isActive: z.boolean().default(true),
  name: z.string().min(1),
  slug: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export const upsertService = createServerFn({ method: "POST" })
  .inputValidator(upsertServiceSchema)
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async ({ data }) => {
    if (data.id) {
      await db
        .update(service)
        .set({
          description: data.description,
          isActive: data.isActive,
          name: data.name,
          slug: data.slug,
          sortOrder: data.sortOrder,
        })
        .where(eq(service.id, data.id));

      return { id: data.id };
    }

    const id = crypto.randomUUID();

    await db.insert(service).values({
      description: data.description,
      id,
      isActive: data.isActive,
      name: data.name,
      slug: data.slug,
      sortOrder: data.sortOrder,
    });

    return { id };
  });
