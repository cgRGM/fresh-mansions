import { Badge } from "@fresh-mansions/ui/components/badge";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { getProperties } from "@/functions/get-properties";
import { getPropertyDisplayAddress } from "@/lib/address";

const propertiesRouteApi = getRouteApi("/app/properties/");

const PropertiesListPage = () => {
  const { properties } = propertiesRouteApi.useLoaderData();

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 stagger-children">
        {/* Header */}
        <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
            Properties
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
            Your saved properties
          </h1>
          <p className="mt-1 text-sm text-black/45">
            Properties are added automatically when you submit a quote request.
          </p>
        </div>

        {/* Content */}
        {properties.length === 0 ? (
          <EmptyState
            action={{
              href: "/get-quote",
              label: "Request your first estimate",
            }}
            description="Properties are added when you request a quote. Start with an estimate visit and your property list will build from there."
            illustration="sun"
            title="No properties yet"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((prop) => (
              <Link
                className="group block rounded-3xl border border-black/6 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:border-black/12 hover:shadow-md"
                key={prop.id}
                params={{ propertyId: prop.id }}
                to="/app/properties/$propertyId"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold tracking-[-0.02em] text-black">
                        {prop.nickname ?? "Property"}
                      </h2>
                      <p className="mt-1 text-sm text-black/50">
                        {getPropertyDisplayAddress(prop)}
                      </p>
                      <Badge className="mt-2.5" variant="secondary">
                        {prop.quotes?.length ?? 0} quote
                        {(prop.quotes?.length ?? 0) === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-black/20 transition-transform group-hover:translate-x-0.5 group-hover:text-black/50" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/app/properties/")({
  component: PropertiesListPage,
  loader: () => getProperties(),
});
