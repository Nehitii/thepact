import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface CrosshairState {
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
}

const Ctx = createContext<CrosshairState | null>(null);

export function PrismCrosshairProvider({ children }: { children: ReactNode }) {
  const [hoverKey, setHoverKeyRaw] = useState<string | null>(null);
  const setHoverKey = useCallback((k: string | null) => setHoverKeyRaw(k), []);
  return <Ctx.Provider value={{ hoverKey, setHoverKey }}>{children}</Ctx.Provider>;
}

export function usePrismCrosshair() {
  const v = useContext(Ctx);
  if (!v) {
    return {
      hoverKey: null as string | null,
      setHoverKey: (_: string | null) => {},
    };
  }
  return v;
}