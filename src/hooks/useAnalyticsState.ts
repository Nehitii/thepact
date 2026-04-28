import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { AnalyticsPeriod } from "@/components/analytics/PeriodSelector";
import type { PrismSection } from "@/components/analytics/PrismRail";

const STORAGE_KEY = "pacte:analytics:state";

const SECTIONS: PrismSection[] = [
  "overview",
  "goals",
  "focus",
  "health",
  "finance",
  "habits",
];
const PERIODS: AnalyticsPeriod[] = ["30d", "90d", "6m", "all"];

function isSection(s: string | null): s is PrismSection {
  return !!s && (SECTIONS as string[]).includes(s);
}
function isPeriod(p: string | null): p is AnalyticsPeriod {
  return !!p && (PERIODS as string[]).includes(p);
}

function readStorage(): { section?: PrismSection; period?: AnalyticsPeriod } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return {
      section: isSection(v?.section) ? v.section : undefined,
      period: isPeriod(v?.period) ? v.period : undefined,
    };
  } catch {
    return {};
  }
}

export function useAnalyticsState(defaults: {
  section: PrismSection;
  period: AnalyticsPeriod;
}) {
  const [search, setSearch] = useSearchParams();

  // Initial: URL first, then storage, then defaults
  const initial = (() => {
    const stored = readStorage();
    const sec = search.get("section");
    const per = search.get("period");
    return {
      section: isSection(sec) ? sec : (stored.section ?? defaults.section),
      period: isPeriod(per) ? per : (stored.period ?? defaults.period),
    };
  })();

  const [section, setSectionState] = useState<PrismSection>(initial.section);
  const [period, setPeriodState] = useState<AnalyticsPeriod>(initial.period);

  // Sync to URL (replace, no history pollution)
  useEffect(() => {
    const next = new URLSearchParams(search);
    next.set("section", section);
    next.set("period", period);
    if (next.toString() !== search.toString()) {
      setSearch(next, { replace: true });
    }
  }, [section, period, search, setSearch]);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ section, period }));
    } catch {
      /* ignore */
    }
  }, [section, period]);

  const setSection = useCallback((s: PrismSection) => setSectionState(s), []);
  const setPeriod = useCallback((p: AnalyticsPeriod) => setPeriodState(p), []);

  // Cycle period helper for left/right shortcuts
  const cyclePeriod = useCallback((dir: 1 | -1) => {
    setPeriodState((p) => {
      const idx = PERIODS.indexOf(p);
      const next = (idx + dir + PERIODS.length) % PERIODS.length;
      return PERIODS[next];
    });
  }, []);

  return { section, period, setSection, setPeriod, cyclePeriod };
}

export const ANALYTICS_SECTIONS = SECTIONS;
export const ANALYTICS_PERIODS = PERIODS;