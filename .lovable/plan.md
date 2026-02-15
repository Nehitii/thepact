
# Application Audit: Cleanup and Reorganization Plan

## Summary of Findings

After a thorough audit of the codebase, I identified **4 orphaned files** that are never imported anywhere, **1 duplicate re-export file**, and **1 placeholder page** that serves no purpose. Everything else is actively used.

---

## 1. Files to DELETE (Unused / Orphaned)

### A. `src/pages/Index.tsx`
- Generic "Welcome to Your Blank App" placeholder page
- Never imported or referenced anywhere in the app (not in `App.tsx` routes, not imported by any file)
- The `/` route already points to `Home.tsx`

### B. `src/components/profile/ProfileFinanceSettings.tsx`
- Placeholder component with a "coming soon" message and a non-functional save button
- Never imported anywhere in the application (zero references found)

### C. `src/components/profile/ProfileAchievements.tsx`
- Uses `ProfileMenuCard` but is never imported by any page or component
- Dead code with no consumer

### D. `src/components/profile/ProfileSignOut.tsx`
- Never imported anywhere
- Sign-out functionality is already handled directly in `AppSidebar.tsx` via the dropdown menu

### E. `src/components/ui/use-toast.ts` (duplicate re-export)
- This file simply re-exports `useToast` and `toast` from `@/hooks/use-toast`
- No file in the project imports from `@/components/ui/use-toast` -- all imports go directly to `@/hooks/use-toast`
- Pure dead code

---

## 2. What was verified and is NOT orphaned

The following files were checked and are confirmed to be actively used:

| File | Used By |
|------|---------|
| `CyberBackground.tsx` | 7 pages (Goals, Community, Shop, Wishlist, GoalDetail, StepDetail, ProfileSettingsShell) |
| `PactVisual.tsx` | HeroSection |
| `PactTimeline.tsx` | Home page |
| `ParticleEffect.tsx` | Goals, GoalDetail, TodoGamifiedTaskCard |
| `GoalImageUpload.tsx` | GoalDetail, NewGoal |
| `GoalDetail_handlers.tsx` | GoalDetail (dynamic import) |
| `useAdminMode.ts` | AdminMode page (exports multiple hooks used there) |
| All health components | Health page |
| All todo components | TodoList page |
| All shop components | Shop page |
| All profile sub-components | Various profile pages |

---

## 3. Technical Steps

```text
Step 1: Delete 5 orphaned files
   - src/pages/Index.tsx
   - src/components/profile/ProfileFinanceSettings.tsx
   - src/components/profile/ProfileAchievements.tsx
   - src/components/profile/ProfileSignOut.tsx
   - src/components/ui/use-toast.ts

Step 2: No barrel export updates needed
   - None of these deleted files are exported from any index.ts
```

This is a conservative cleanup. No refactoring of working code, no restructuring of directories -- just removal of confirmed dead files that add noise to the codebase.
