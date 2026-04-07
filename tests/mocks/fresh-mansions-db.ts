import type { Mock } from "vitest";
import { vi } from "vitest";

interface MockDb {
  insert: Mock;
  query: {
    contractor: { findFirst: Mock; findMany: Mock };
    customer: { findFirst: Mock; findMany: Mock };
    invoice: { findFirst: Mock; findMany: Mock };
    property: { findFirst: Mock; findMany: Mock };
    quote: { findFirst: Mock; findMany: Mock };
    route: { findFirst: Mock; findMany: Mock };
    routeStop: { findFirst: Mock; findMany: Mock };
    stripeEvent: { findFirst: Mock; findMany: Mock };
    subscription: { findFirst: Mock; findMany: Mock };
    workOrder: { findFirst: Mock; findMany: Mock };
  };
  update: Mock;
}

const createQueryModel = () => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
});

const createMockDb = (): MockDb => ({
  insert: vi.fn(),
  query: {
    contractor: createQueryModel(),
    customer: createQueryModel(),
    invoice: createQueryModel(),
    property: createQueryModel(),
    quote: createQueryModel(),
    route: createQueryModel(),
    routeStop: createQueryModel(),
    stripeEvent: createQueryModel(),
    subscription: createQueryModel(),
    workOrder: createQueryModel(),
  },
  update: vi.fn(),
});

const globalKey = "__FRESH_MANSIONS_TEST_DB__";
const globalStore = globalThis as typeof globalThis & {
  [globalKey]?: MockDb;
};

if (!globalStore[globalKey]) {
  globalStore[globalKey] = createMockDb();
}

export const db = globalStore[globalKey] as MockDb;
