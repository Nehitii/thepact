

# Full Application Audit Report — VowPact

## Application Overview
VowPact is a gamified productivity app with 20+ modules (Goals, Finance, Health, Todo, Journal, Focus, Wishlist, Calendar, Community, etc.), a cyberpunk HUD design system, and a Lovable Cloud backend. ~180 components, 50+ hooks, 28 routes, 8 edge functions, 30+ DB tables.

---

## 1. Architecture and Code Quality

### 🔴 Critical

**1.1 — No Error Boundary anywhere in the app**
Zero `ErrorBoundary` components found. A single uncaught error in any lazy-loaded page crashes the entire app with a white screen. Every route should be wrapped in an error boundary with a recovery UI.

**1.2 — 685 `as any` casts across 48 files**
Massive type-safety gap. Most are Supabase queries on tables whose types don't match `types.ts` (e.g., `habit_logs`, `friendships`, profile updates). This hides real bugs and makes refactoring dangerous. Many indicate the DB types file is out of sync with actual schema.

### 🟡 Major

**1.3 — 8 page files exceed 400 lines** (GoalDetail: 437, Wishlist: ~700, Auth: 400, Friends: ~500, AppSidebar: 650, Focus, Analytics, TheCall). These are monoliths mixing state, UI, and business logic. GoalDetail alone has 5 `useEffect` hooks syncing React Query data into local state — a pattern that creates stale-state bugs.

**1.4 — No barrel exports for most module folders**. Some have `index.ts` (goals, finance, calendar), many don't (todo, health, wishlist, journal, community, friends). Inconsistent import patterns.

**1.5 — `React.memo` used only in GoalDetail subcomponents** (6 files). High-frequency re-rendering pages like Home (which fetches pact, goals, rank, modules, analytics) have zero memoization.

**1.6 — Dead/duplicate utility exports**. `src/lib/index.ts` barrel exports utilities but most files import directly from specific files. The barrel is partially maintained and creates confusion about canonical import paths.

**1.7 — `AdminMoneyManager` uses `useEffect(() => { loadData(); }, [])` with manual async fetch** instead of React Query. This breaks the established data-fetching pattern and bypasses caching.

### 🟢 Minor

**1.8 — Mixed French/English comments** throughout the codebase. Some files are fully French-commented (AppLayout, Auth), others English. Not a bug but affects maintainability.

**1.9 — `icon: any` type in AppSidebar NavItem interface** (line 60). Should be `React.ComponentType<LucideProps>`.

**1.10 — `CyberTerminalField` in Auth.tsx typed as `(props: any)`** — local component with no type safety.

---

## 2. UI/UX and Design System

### 🟡 Major

**2.1 — `index.css` is 2,418 lines** containing component-specific CSS that should live in component files or Tailwind plugins. Includes entire Auth page styles, bar-card 3D effects, journal styles, todo boot sequence, shop styles, etc. This monolith makes it hard to find and maintain styles.

**2.2 — Inconsistent loading states across pages**. Some pages show spinners (Profile, Journal), some show skeleton grids (Achievements, Leaderboard), some show plain "Loading..." text (Wishlist). No unified loading component.

**2.3 — No empty state illustrations**. Most modules show plain text "No items" messages. The cyberpunk theme could benefit from themed empty states (e.g., "Signal Lost" pattern already exists in Shop but isn't reused).

**2.4 — Color hardcoding in multiple components**. Calendar events use hardcoded `#3b82f6`, finance categories use hardcoded hex values, while the design system defines HSL variables. Mixed color systems.

### 🟢 Minor

**2.5 — `font-orbitron` headers inconsistently applied**. Some module headers use it, others use default sans. The CyberPanel design system mandates it but not all pages adopted the unified settings-ui components.

**2.6 — Tooltip wrapping inconsistency**. Some components wrap individual tooltips, others rely on the global `TooltipProvider` in AppProviders. Both work, but the redundancy adds bundle weight.

---

## 3. Responsiveness and Accessibility

### 🔴 Critical

**3.1 — `aria-*` attributes found in only 18 of 180+ component files**. The vast majority of interactive elements (buttons, toggles, modals, tabs, drag handles) have no ARIA labels. Screen readers cannot meaningfully navigate the app.

### 🟡 Major

**3.2 — Auth page uses `window.innerWidth < 768` check in a `useState` initial value** (line 19) with no resize listener. If a user rotates their device, the layout won't adapt. Should use `useIsMobile()` hook that already exists.

**3.3 — Calendar views lack keyboard navigation**. The plan included keyboard nav (arrow keys between days, Enter to open) but the current MonthView implementation doesn't have `tabIndex`, `onKeyDown`, or focus management on day cells.

**3.4 — No `<main>` landmark in AppLayout**. The content area is a `<div>` — screen readers cannot identify the main content region. Should be `<main>`.

**3.5 — Drag-and-drop (Wishlist, Calendar, Todo) has no keyboard alternative**. `@dnd-kit` supports keyboard sensors but none are configured.

### 🟢 Minor

**3.6 — `hex-stream` in Auth has `aria-hidden="true"` (good), but the `CyberTerminalField` label uses a decorative `>` arrow inside the label text** — screen readers will read "greater than Email" instead of "Email".

---

## 4. Performance

### 🟡 Major

**4.1 — `HexDataStream` in Auth.tsx runs `setInterval` every 150ms** generating random strings and causing React state updates. On slower devices this creates visible jank. Should use CSS animation or canvas instead of React re-renders.

**4.2 — Home page triggers 6+ parallel queries** (pact, goals, rank, profile, active mission, modules, analytics) on every mount. No query deduplication or prefetching strategy. Combined with `staleTime: 30_000`, navigating away and back re-fetches everything.

**4.3 — `useCalendarEvents` fetches todos, goals, AND steps on every calendar render** even when source filters are toggled off. Should skip queries when filters are disabled.

**4.4 — `ParticleEffect` component** (imported in GoalDetail) likely runs canvas animations. Not checked if it cleans up properly or is conditionally rendered.

**4.5 — No `React.lazy` for heavy sub-components within pages**. Pages are lazy-loaded but their internal heavy components (charts, editors, modals) are eagerly imported. The Recharts bundle in Finance/Analytics is always loaded.

### 🟢 Minor

**4.6 — `CyberBackground` component imported in multiple pages** — each instance likely creates its own animation loop. Should be rendered once at layout level if used everywhere.

**4.7 — `staleTime: 30_000` globally** may be too aggressive for data that rarely changes (achievement definitions, cosmetic frames, shop items). These could use `staleTime: Infinity` with manual invalidation.

---

## 5. Reliability and Error Handling

### 🔴 Critical

**5.1 — Zero `try/catch` blocks in hook mutation functions** (`src/hooks/`). All Supabase mutations use `const { error } = await supabase...` and check `if (error) throw error`, but the calling components often don't have error handling around `mutateAsync` calls. Failed mutations may show as unhandled promise rejections.

**5.2 — `ProtectedRoute` calls `usePact`, `useSharedPacts`, and `useProfile` on every route change** — if any of these queries fail (network issue), the app may render incorrectly or redirect to pact-selector erroneously. No error state handling in ProtectedRoute.

### 🟡 Major

**5.3 — Form validation is inconsistent**. Auth.tsx uses Zod schemas (good), but most other forms (NewGoal, AddTransactionModal, EventDetailModal, AddAccountModal) use manual validation or none at all. Missing required field checks on several forms.

**5.4 — No retry UI for failed data fetches**. React Query `retry: 1` is set globally but there's no user-facing "retry" button on any page. If initial load fails, users see loading spinners forever or empty states with no action.

**5.5 — `useEffect` dependency arrays may be stale** in GoalDetail (5 effects syncing React Query into useState). When query refetches, effects re-run but may overwrite user edits in the edit overlay. Race condition between edit state and query refetch.

### 🟢 Minor

**5.6 — `supabase.auth.getSession()` in AuthContext runs after `onAuthStateChange`** — if both resolve simultaneously, `setUser` may be called twice with the same value, causing unnecessary re-renders.

**5.7 — No optimistic updates** on any mutation. Every action (toggle step, complete todo, add event) waits for server round-trip before UI updates. This makes the app feel slower than it needs to.

---

## Summary Table

| Area | 🔴 Critical | 🟡 Major | 🟢 Minor |
|------|:-----------:|:--------:|:--------:|
| Architecture & Code | 2 | 5 | 3 |
| UI/UX & Design | 0 | 3 | 2 |
| Responsiveness & a11y | 1 | 4 | 1 |
| Performance | 0 | 5 | 2 |
| Reliability & Errors | 2 | 3 | 2 |
| **Total** | **5** | **20** | **10** |

---

## Recommended Fix Order

**Phase 1 — Critical (immediate):**
1. Add `ErrorBoundary` wrapper around all routes
2. Add `<main>` landmark to AppLayout
3. Add error/retry states to ProtectedRoute
4. Add try/catch + error toasts to all mutation callsites
5. Fix worst `as any` casts (hooks that query DB)

**Phase 2 — Major (high impact):**
6. Split monolith pages (GoalDetail, Wishlist, Friends, Auth)
7. Unify loading/empty states with reusable components
8. Add keyboard support to calendar and DnD
9. Add ARIA labels to all interactive elements
10. Move Auth HexDataStream to CSS/canvas
11. Add form validation (Zod) to all create/edit forms
12. Conditional query skipping in useCalendarEvents

**Phase 3 — Minor (quality of life):**
13. Standardize comments language
14. Fix remaining type casts
15. Add optimistic updates to key mutations
16. Refine staleTime per query type

Awaiting your approval to begin implementing the Critical fixes (Phase 1).

