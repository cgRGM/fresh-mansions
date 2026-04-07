import { vi } from "vitest";

import { db } from "../../mocks/fresh-mansions-db";

export const getMockDb = () => db;

export const resetMockDb = () => {
  db.insert.mockReset();
  db.update.mockReset();

  for (const model of Object.values(db.query)) {
    model.findFirst.mockReset();
    model.findMany.mockReset();
  }
};

export const createInsertChain = <T>(result?: T) => {
  const values = vi.fn().mockResolvedValue(result);

  return {
    chain: {
      values,
    },
    values,
  };
};

export const createUpdateChain = <T>(result?: T) => {
  const where = vi.fn().mockResolvedValue(result);
  const set = vi.fn().mockReturnValue({ where });

  return {
    chain: {
      set,
    },
    set,
    where,
  };
};
