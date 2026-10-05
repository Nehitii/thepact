// Lazy import factories for navigation pages. Reused by App.tsx (lazy()),
// by AppSidebar (hover prefetch) and by AppLayout (idle background prefetch).

export const routeImports = {
  home: () => import("@/pages/Home"),
  goals: () => import("@/pages/Goals"),
  newGoal: () => import("@/pages/NewGoal"),
  goalDetail: () => import("@/pages/GoalDetail"),
  finance: () => import("@/pages/Finance"),
  journal: () => import("@/pages/Journal"),
  health: () => import("@/pages/Health"),
  todoList: () => import("@/pages/TodoList"),
  focus: () => import("@/pages/Focus"),
  calendar: () => import("@/pages/Calendar"),
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
  lifeAreas: () => import("@/pages/profile/LifeAreas"),
  automations: () => import("@/pages/profile/Automations"),
  wishlist: () => import("@/pages/Wishlist"),
  reviews: () => import("@/pages/Reviews"),
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
  "/profile/data": routeImports.dataPortability,
  "/profile/life-areas": routeImports.lifeAreas,
  "/profile/automations": routeImports.automations,
  "/wishlist": routeImports.wishlist,
  "/reviews": routeImports.reviews,
};

const prefetched = new Set<string>();

function isSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as any).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const et = conn.effectiveType as string | undefined;
  return et === "2g" || et === "slow-2g";
}

// Re-exported so the data-prefetch module shares the exact same gate.
export const shouldSkipPrefetch = isSaveData;

function runIdle(cb: () => void) {
  const ric = (globalThis as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined;
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