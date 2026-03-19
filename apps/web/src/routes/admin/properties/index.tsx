import { db } from "@fresh-mansions/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fresh-mansions/ui/components/table";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

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

export const Route = createFileRoute("/admin/properties/")({
  component: AdminPropertiesPage,
  loader: () => listProperties(),
});

function AdminPropertiesPage() {
  const properties = Route.useLoaderData();

  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Properties</h1>
        <div className="rounded-lg border bg-white p-12 text-center text-gray-500">
          No properties yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Properties</h1>
      <div className="rounded-lg border bg-white">
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
                  {`${p.street}, ${p.city}, ${p.state} ${p.zip}`}
                </TableCell>
                <TableCell>{p.customer?.user?.name ?? "Unknown"}</TableCell>
                <TableCell>{p.nickname ?? "—"}</TableCell>
                <TableCell>{p.quotes?.length ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
