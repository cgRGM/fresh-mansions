import { Badge } from "@fresh-mansions/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@fresh-mansions/ui/components/card";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { Home, MapPin } from "lucide-react";

import { getProperties } from "@/functions/get-properties";
import { getPropertyDisplayAddress } from "@/lib/address";

const propertiesRouteApi = getRouteApi("/app/properties/");

const PropertiesListPage = () => {
  const { properties } = propertiesRouteApi.useLoaderData();

  if (properties.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Properties</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="mb-4 h-12 w-12 text-gray-300" />
            <p className="mb-2 text-lg text-gray-500">No properties yet</p>
            <p className="text-sm text-gray-400">
              Properties are added when you request a quote.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Properties</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {properties.map((prop) => (
          <Link
            key={prop.id}
            to="/app/properties/$propertyId"
            params={{ propertyId: prop.id }}
          >
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {prop.nickname ?? "Property"}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {getPropertyDisplayAddress(prop)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  {prop.quotes?.length ?? 0} quote
                  {(prop.quotes?.length ?? 0) === 1 ? "" : "s"}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/app/properties/")({
  component: PropertiesListPage,
  loader: () => getProperties(),
});
