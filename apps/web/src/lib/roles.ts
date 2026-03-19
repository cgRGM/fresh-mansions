export const getDefaultRouteForRole = (role?: string): string => {
  switch (role) {
    case "admin": {
      return "/admin/quotes";
    }
    case "contractor": {
      return "/contractor";
    }
    default: {
      return "/app/dashboard";
    }
  }
};
