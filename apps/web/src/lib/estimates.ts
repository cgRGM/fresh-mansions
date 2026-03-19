import type { PropertySize, ServiceType } from "@fresh-mansions/db/validators";

const ESTIMATE_TABLE: Record<
  ServiceType,
  Record<PropertySize, [low: number, high: number]>
> = {
  cleanup: {
    large: [25_000, 40_000],
    medium: [15_000, 25_000],
    small: [10_000, 15_000],
    xlarge: [40_000, 70_000],
  },
  fertilization: {
    large: [13_000, 20_000],
    medium: [8000, 13_000],
    small: [5000, 8000],
    xlarge: [20_000, 35_000],
  },
  landscaping: {
    large: [45_000, 80_000],
    medium: [25_000, 45_000],
    small: [15_000, 25_000],
    xlarge: [80_000, 150_000],
  },
  mowing: {
    large: [7500, 12_000],
    medium: [5000, 7500],
    small: [3500, 5000],
    xlarge: [12_000, 20_000],
  },
};

export function getEstimate(
  serviceType: ServiceType,
  propertySize: PropertySize
): { high: number; low: number } {
  const [low, high] = ESTIMATE_TABLE[serviceType][propertySize];
  return { high, low };
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}
