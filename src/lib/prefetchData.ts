import type { QueryClient } from "@tanstack/react-query";
import { shouldSkipPrefetch } from "./prefetchRoutes";
import { fetchPact } from "@/hooks/usePact";
import { fetchGoals } from "@/hooks/useGoals";
import { fetchTodoTasks } from "@/hooks/useTodoList";
import { fetchFinanceSettings } from "@/hooks/useFinance";
import { fetchTodayHealth } from "@/hooks/useHealth";
import { fetchFocusSessions } from "@/hooks/useFocusSessions";

/**
 * Background data prefetch for the most-used navigation pages.
 *
 * Runs once per session, after the code-chunk prefetch, during idle time.
 * Uses the SAME queryKey + queryFn as the page hooks so that opening the page
 * resolves instantly from cache (no double-fetch while staleTime is valid).
 *
 * Skipped entirely on Save-Data / 2g.
 * Each step is awaited sequentially so we never burst-fire requests.
 */

const STALE_TIME = 5 * 60 * 1000;

function runIdle(cb: () => void) {
  const ric = (globalThis as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined;
  if (ric) ric(cb, { timeout: 2000 });
  else setTimeout(cb, 200);
}

let dataPrefetched = false;

export function prefetchCoreData(qc: QueryClient, userId: string | undefined): void {
  if (dataPrefetched) return;
  if (shouldSkipPrefetch()) return;
  if (!userId) return;
  dataPrefetched = true;

  // Build the list lazily: pact must resolve first so goals can use its id.
  const steps: Array<() => Promise<unknown>> = [
    // Active pact — used by Home, Goals, Finance, Focus, Wishlist…
    () =>
      qc.prefetchQuery({
        queryKey: ["pact", userId],
        queryFn: () => fetchPact(userId),
        staleTime: STALE_TIME,
      }),
    // Goals (no step counts) — Home, Finance, Wishlist, Focus
    () => {
      const pact = qc.getQueryData<{ id: string } | null>(["pact", userId]);
      const pactId = pact?.id;
      if (!pactId) return Promise.resolve();
      return qc.prefetchQuery({
        queryKey: ["goals", pactId, false, true],
        queryFn: () => fetchGoals(pactId, { includeStepCounts: false, includeTags: true }),
        staleTime: STALE_TIME,
      });
    },
    // Goals with step counts — Goals page, GoalDetail
    () => {
      const pact = qc.getQueryData<{ id: string } | null>(["pact", userId]);
      const pactId = pact?.id;
      if (!pactId) return Promise.resolve();
      return qc.prefetchQuery({
        queryKey: ["goals", pactId, true, true],
        queryFn: () => fetchGoals(pactId, { includeStepCounts: true, includeTags: true }),
        staleTime: STALE_TIME,
      });
    },
    // Todo tasks
    () =>
      qc.prefetchQuery({
        queryKey: ["todo-tasks", userId],
        queryFn: () => fetchTodoTasks(userId),
        staleTime: STALE_TIME,
      }),
    // Finance settings
    () =>
      qc.prefetchQuery({
        queryKey: ["finance-settings", userId],
        queryFn: () => fetchFinanceSettings(userId),
        staleTime: STALE_TIME,
      }),
    // Today's health
    () =>
      qc.prefetchQuery({
        queryKey: ["health-today", userId],
        queryFn: () => fetchTodayHealth(userId),
        staleTime: STALE_TIME,
      }),
    // Recent focus sessions (default limit 50, matches useFocusSessions())
    () =>
      qc.prefetchQuery({
        queryKey: ["focus-sessions", userId, 50],
        queryFn: () => fetchFocusSessions(50),
        staleTime: STALE_TIME,
      }),
  ];

  let i = 0;
  const step = () => {
    if (shouldSkipPrefetch()) return;
    if (i >= steps.length) return;
    const fn = steps[i++];
    Promise.resolve()
      .then(fn)
      .catch(() => {
        // silent — a failed prefetch must never bubble up
      })
      .finally(() => runIdle(step));
  };
  runIdle(step);
}