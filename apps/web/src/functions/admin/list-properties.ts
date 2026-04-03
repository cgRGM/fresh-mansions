import { db } from "@fresh-mansions/db";
import { createServerFn } from "@tanstack/react-start";

import { withPropertiesFullAddress } from "@/lib/quote-records";
import { authMiddleware } from "@/middleware/auth";
import { requireRoleMiddleware } from "@/middleware/roles";

export const listProperties = createServerFn({ method: "GET" })
  .middleware([authMiddleware, requireRoleMiddleware("admin")])
  .handler(async () => {
    const properties = await db.query.property.findMany({
      with: {
        customer: {
          with: {
            user: true,
          },
        },
      },
    });

    return properties.map((p) => ({
      ...p,
      fullAddress:
        p.formattedAddress ?? `${p.street}, ${p.city}, ${p.state} ${p.zip}`,
    }));
  });
