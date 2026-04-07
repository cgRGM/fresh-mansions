import { db } from "@fresh-mansions/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fresh-mansions/ui/components/table";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { MapPin } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { authMiddleware } from "@/middleware/auth";

const listProperties = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const properties = await db.query.property.findMany({
      with: {
        customer: {
          with: {
            user: true,
          },
        },
        quotes: true,
      },
    });
    return properties;
  });

const routeApi = getRouteApi("/admin/properties/");

const AdminPropertiesPage = () => {
  const properties = routeApi.useLoaderData();

  return (
    <div className="stagger-children space-y-5">
      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Property registry
            </p>
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
              Properties
            </h1>
          </div>
        </div>
      </section>

      {properties.length === 0 ? (
        <EmptyState
          description="Properties will appear here once customers add them during the quote request flow."
          illustration="grass"
          title="No properties yet"
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-black/6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Nickname</TableHead>
                <TableHead>Quotes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-black/30" />
                      {`${p.street}, ${p.city}, ${p.state} ${p.zip}`}
                    </div>
                  </TableCell>
                  <TableCell>{p.customer?.user?.name ?? "Unknown"}</TableCell>
                  <TableCell>{p.nickname ?? "—"}</TableCell>
                  <TableCell>{p.quotes?.length ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
};

export const Route = createFileRoute("/admin/properties/")({
  component: AdminPropertiesPage,
  loader: () => listProperties(),
});
