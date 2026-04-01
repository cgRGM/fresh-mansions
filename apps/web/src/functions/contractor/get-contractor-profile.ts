import { db } from "@fresh-mansions/db";
import { contractor } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const getContractorProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("contractor")])
  .handler(async ({ context }) => {
    const { contractorId } = context.session.appUser;

    if (!contractorId) {
      return { contractor: null };
    }

    const contractorRecord = await db.query.contractor.findFirst({
      where: eq(contractor.id, contractorId),
      with: { user: true },
    });

    return { contractor: contractorRecord ?? null };
  });
