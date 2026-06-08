const MRO_API_URL = "https://planner.myrouteonline.com/ws_api/";

export interface MyRouteOnlineAddress {
  address: string;
  ex?: Record<string, unknown>;
  idNumber: number;
  title?: string;
}

export interface MyRouteOnlineStartAddress {
  address: string;
  ex?: Record<string, unknown>;
  idNumber: number;
}

export interface MyRouteOnlineRouteStop {
  address?: string;
  fullAddress?: string;
  stopAddressId?: number;
  stopNumber?: number;
}

export interface MyRouteOnlineRoute {
  myRouteAppLaunchInfo?: {
    myRouteAppDirectLaunchUrl?: string;
    printAndDirectionsUrl?: string;
  };
  stops?: MyRouteOnlineRouteStop[];
}

export interface MyRouteOnlineResponse {
  errorMessage?: string;
  isFinished?: boolean;
  isSuccessful?: boolean;
  jobToken?: string;
  processingProgress?: number;
  processingStatus?: string;
  routes?: MyRouteOnlineRoute[];
}

export interface MyRouteOnlinePlanRequest {
  addresses: MyRouteOnlineAddress[];
  departureTime?: string;
  startAddress?: MyRouteOnlineStartAddress;
}

const postToMyRouteOnline = async (
  method: "routePlanCheck" | "routePlanStart",
  body: URLSearchParams
): Promise<MyRouteOnlineResponse> => {
  const response = await fetch(`${MRO_API_URL}?m=${method}`, {
    body: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("MyRouteOnline request failed");
  }

  return (await response.json()) as MyRouteOnlineResponse;
};

export const startMyRouteOnlinePlan = async ({
  apiKey,
  request,
}: {
  apiKey: string;
  request: MyRouteOnlinePlanRequest;
}): Promise<MyRouteOnlineResponse> => {
  const routesConstraints = request.startAddress
    ? {
        specificRouteConstraints: [
          {
            startAt: request.startAddress,
            startTime: request.departureTime ?? "9:00",
          },
        ],
      }
    : undefined;

  const inRequest = {
    additionalOutputRequest: {
      myRouteAppNavigationLaunchUrl: true,
    },
    addresses: request.addresses,
    routesConstraints,
    routingParameters: {
      visitClosestFirst: "true",
    },
  };

  const body = new URLSearchParams();
  body.append("apiToken", apiKey);
  body.append("inRequest", JSON.stringify(inRequest));

  return postToMyRouteOnline("routePlanStart", body);
};

export const checkMyRouteOnlinePlan = async ({
  apiKey,
  jobToken,
}: {
  apiKey: string;
  jobToken: string;
}): Promise<MyRouteOnlineResponse> => {
  const body = new URLSearchParams();
  body.append("apiToken", apiKey);
  body.append("jobToken", jobToken);

  return postToMyRouteOnline("routePlanCheck", body);
};
