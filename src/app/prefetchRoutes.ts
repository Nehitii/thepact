// Lazy import factories for navigation pages. Reused by App.tsx (lazy()),
// by AppSidebar (hover prefetch) and by AppLayout (idle background prefetch).

export const routeImports = {
  home: () => import("@/pages/Home"),
  goals: () => import("@/pages/Goals"),
  newGoal: () => import("@/pages/NewGoal"),
  goalDetail: () => import("@/pages/GoalDetail"),
  finance: () => import("@/domaines/finance/pages/Finance"),
  journal: () => import("@/domaines/journal/pages/Journal"),
  health: () => import("@/domaines/sante/pages/Health"),
  todoList: () => import("@/domaines/taches/pages/TodoList"),
  focus: () => import("@/domaines/focus/pages/Focus"),
  calendar: () => import("@/domaines/agenda/pages/Calendar"),
  analytics: () => import("@/pages/Analytics"),
  achievements: () => import("@/pages/Achievements"),
  shop: () => import("@/pages/Shop"),
  profile: () => import("@/pages/Profile"),
  boundedProfile: () => import("@/pages/profile/BoundedProfile"),
  pactSettings: () => import("@/pages/profile/PactSettings"),
  displaySound: () => import("@/pages/profile/DisplaySound"),
  privacyControl: () => import("@/pages/profile/PrivacyControl"),
  notificationSettings: () => import("@/pages/profile/NotificationSettings"),
  dataPortability: () => import("@/pages/profile/DataPortability"),
  healthSettings: () => import("@/domaines/sante/pages/HealthSettings"),
  wishlist: () => import("@/pages/Wishlist"),
} as const;

export type RouteImportKey = keyof typeof routeImports;

// Map: route path -> import factory. Used for hover prefetch in the sidebar.
export const routePathToImport: Record<string, () => Promise<unknown>> = {
  "/": routeImports.home,
  "/goals": routeImports.goals,
  "/goals/new": routeImports.newGoal,
  "/finance": routeImports.finance,
  "/journal": routeImports.journal,
  "/health": routeImports.health,
  "/todo": routeImports.todoList,
  "/focus": routeImports.focus,
  "/calendar": routeImports.calendar,
  "/analytics": routeImports.analytics,
  "/achievements": routeImports.achievements,
  "/shop": routeImports.shop,
  "/profile": routeImports.profile,
  "/profile/bounded": routeImports.boundedProfile,
  "/profile/pact-settings": routeImports.pactSettings,
  "/profile/display-sound": routeImports.displaySound,
  "/profile/privacy": routeImports.privacyControl,
  "/profile/notifications": routeImports.notificationSettings,
  "/profile/health": routeImports.healthSettings,
  "/profile/data": routeImports.dataPortability,
  "/wishlist": routeImports.wishlist,
};

const prefetched = new Set<string>();

function isSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = navigator.connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const et = conn.effectiveType as string | undefined;
  return et === "2g" || et === "slow-2g";
}

// Re-exported so the data-prefetch module shares the exact same gate.
export const shouldSkipPrefetch = isSaveData;

function runIdle(cb: () => void) {
  /* Safari n'a requestIdleCallback que depuis la 18.4 : on teste sa
     presence plutot que d'eteindre le typage de globalThis pour la lire. */
  const ric = typeof globalThis.requestIdleCallback === "function"
    ? globalThis.requestIdleCallback
    : undefined;
  if (ric) ric(cb, { timeout: 2000 });
  else setTimeout(cb, 200);
}

/** Prefetch a single page by its route path. Safe to call repeatedly. */
export function prefetchRoute(path: string): void {
  if (isSaveData()) return;
  const factory = routePathToImport[path];
  if (!factory) return;
  if (prefetched.has(path)) return;
  prefetched.add(path);
  factory().catch(() => {
    // allow retry on next hover
    prefetched.delete(path);
  });
}

/**
 * Prefetch all navigation chunks in the background, one at a time during idle
 * periods. Never blocks the UI and never throws.
 */
export function prefetchAllRoutes(): void {
  if (isSaveData()) return;
  const factories = Object.entries(routeImports);
  let i = 0;
  const step = () => {
    if (i >= factories.length) return;
    const [key, factory] = factories[i++];
    if (prefetched.has(key)) {
      runIdle(step);
      return;
    }
    prefetched.add(key);
    Promise.resolve()
      .then(factory)
      .catch(() => {
        prefetched.delete(key);
      })
      .finally(() => runIdle(step));
  };
  runIdle(step);
}