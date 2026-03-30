import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

interface QuoteFlowContextValue {
  clearFiles: () => void;
  files: File[];
  setFiles: (files: File[]) => void;
}

const QuoteFlowContext = createContext<null | QuoteFlowContextValue>(null);

export const QuoteFlowProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<File[]>([]);

  const value = useMemo<QuoteFlowContextValue>(
    () => ({
      clearFiles: () => setFiles([]),
      files,
      setFiles,
    }),
    [files]
  );

  return (
    <QuoteFlowContext.Provider value={value}>
      {children}
    </QuoteFlowContext.Provider>
  );
};

export const useQuoteFlow = (): QuoteFlowContextValue => {
  const context = useContext(QuoteFlowContext);

  if (!context) {
    throw new Error("useQuoteFlow must be used within QuoteFlowProvider");
  }

  return context;
};
