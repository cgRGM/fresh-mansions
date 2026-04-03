import { db } from "@fresh-mansions/db";
import { service } from "@fresh-mansions/db/schema/domain";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

export const listActiveServices = createServerFn({ method: "GET" }).handler(
  async () => {
    return db.query.service.findMany({
      orderBy: (table, { asc }) => [asc(table.sortOrder)],
      where: eq(service.isActive, true),
    });
  }
);
