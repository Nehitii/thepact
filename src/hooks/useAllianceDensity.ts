import { useEffect, useState } from "react";

export type AllianceDensity = "comfortable" | "compact";
const STORAGE_KEY = "alliance:density";

export function useAllianceDensity() {
  const [density, setDensityState] = useState<AllianceDensity>(() => {
    if (typeof window === "undefined") return "comfortable";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "compact" ? "compact" : "comfortable";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, density);
    } catch {
      /* noop */
    }
  }, [density]);

  const toggle = () =>
    setDensityState((d) => (d === "comfortable" ? "compact" : "comfortable"));

  return { density, setDensity: setDensityState, toggle };
}