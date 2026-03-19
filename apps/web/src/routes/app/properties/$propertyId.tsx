import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@fresh-mansions/ui/components/card";
import { Separator } from "@fresh-mansions/ui/components/separator";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, FileText, MapPin } from "lucide-react";

import { getPropertyDetail } from "@/functions/get-property-detail";
import { formatCents } from "@/lib/estimates";
import { formatQuoteWindow, getQuoteStatusMeta } from "@/lib/quotes";

export const Route = createFileRoute("/app/properties/$propertyId")({
  component: PropertyDetailPage,
  loader: ({ params }) =>
    getPropertyDetail({ data: { propertyId: params.propertyId } }),
});

const PropertyDetailPage = () => {
  const property = Route.useLoaderData();

  if (!property) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <Link to="/app/properties">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-500">Property not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <Link to="/app/properties">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">
            {property.nickname ?? "Property"}
          </CardTitle>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {property.street}, {property.city}, {property.state} {property.zip}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {property.city && (
            <p className="text-sm text-gray-600">
              {property.city}
              {property.state && `, ${property.state}`}
              {property.zip && ` ${property.zip}`}
            </p>
          )}
        </CardContent>
      </Card>

      <Separator className="mb-6" />

      <h2 className="mb-4 text-lg font-semibold text-gray-900">Quotes</h2>
      {!property.quotes || property.quotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No quotes for this property</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {property.quotes.map((quote) => (
            <Link
              key={quote.id}
              to="/app/quotes/$quoteId"
              params={{ quoteId: quote.id }}
            >
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{quote.serviceType}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {quote.estimateLow != null &&
                        quote.estimateHigh != null && (
                          <span>
                            {formatCents(quote.estimateLow)} -{" "}
                            {formatCents(quote.estimateHigh)}
                          </span>
                        )}
                      {quote.preferredStartDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatQuoteWindow(
                            quote.preferredEndDate,
                            quote.preferredStartDate
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Badge
                    className={getQuoteStatusMeta(quote.status).badge}
                    variant="secondary"
                  >
                    {getQuoteStatusMeta(quote.status).label}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
