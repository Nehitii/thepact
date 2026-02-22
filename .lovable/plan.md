

# Sidebar User Settings -- Full Audit and Improvement Plan

## Current Structure

The sidebar has a collapsible "User_Settings" section with 7 links, plus a footer dropdown with 2 options.

### Sidebar Links (User_Settings)

| Link | Route | Page | Status |
|---|---|---|---|
| Account Information | `/profile` | Email, display name, birthday, timezone, language, currency | Works correctly |
| Bounded Profile | `/profile/bounded` | Avatar, cosmetic frames/banners/titles, trading card preview | Works correctly |
| Pact Settings | `/profile/pact-settings` | Identity, timeline, custom difficulty, ranks, reset | Works correctly |
| Display and Sound | `/profile/display-sound` | Theme, reduce motion, sounds, particles | Works correctly |
| Notifications | `/profile/notifications` | System, progress, social, marketing toggles | Works correctly |
| Privacy and Control | `/profile/privacy` | Community visibility, goal visibility, community notifications | Works correctly |
| Data and Portability | `/profile/data` | Stats overview, JSON export, link to Legal page | Works correctly |

### Footer Dropdown (Quick Actions)

| Option | Route | Status |
|---|---|---|
| Inbox | `/inbox` | Works correctly, shows unread badge |
| Disconnect (Sign Out) | `/auth` | Works correctly |

---

## Issues Found

### A. Functional Problems

| Issue | Severity | Details |
|---|---|---|
| Hardcoded French section titles in Account page | Medium | `ProfileAccountSettings.tsx` has "Informations Personnelles" and "Preferences Regionales" hardcoded in French instead of using i18n `t()` keys. English-speaking users see French headings. |
| Bounded Profile props are dead | Low | `BoundedProfile.tsx` passes `avatarFrame=""`, `personalQuote=""`, `displayedBadges={[]}` and no-op handlers to `ProfileBoundedProfile`. The component ignores them anyway (it loads its own data), but the prop interface is misleading. |
| Data and Portability page has no i18n | Low | All strings in `DataPortability.tsx` are hardcoded English ("Your Data", "Export Your Data", "Terms and Legal", etc.). |
| Legal page has no i18n | Low | All strings in `Legal.tsx` are hardcoded English. |
| Sidebar dot indicator has a bug | Medium | Line 286-289 in `AppSidebar.tsx`: the `className` prop receives a function `({ isActive }) => ...` but it's inside a static `cn()` call, not a render prop. The active dot never changes color -- it always renders `"bg-slate-700"`. |

### B. Missing Options and Features

| Missing Item | Impact | Details |
|---|---|---|
| Achievements link | Medium | The `/achievements` page exists and is fully implemented (trophy wall with rarity filters), but there is no link to it anywhere in the sidebar. Users can only reach it if they know the URL. It should be added either to the main navigation or as a profile sub-item. |
| Two-Factor Authentication settings | Medium | A `/two-factor` route exists with a full 2FA setup page (`TwoFactor.tsx`), plus a `useTwoFactor` hook and a `two-factor` edge function. But there is no link to it from the sidebar or any settings page. Users cannot discover or manage 2FA. It should be added to Account Information or as its own sub-item under User_Settings. |
| Account deletion access | Low | The Legal page (`/legal`) contains an account deletion flow (double confirmation dialog). But it's buried under "Data and Portability > View Terms and Legal". A direct "Delete Account" danger zone should exist in Account Information or Privacy. |
| Password change | Medium | There is no way for users to change their password. No UI exists for it. Since the app uses email/password auth, a "Change Password" option should exist in Account Information. |

### C. UX Issues

| Issue | Details |
|---|---|
| Footer dropdown is too minimal | Only 2 options (Inbox, Sign Out). It could also include a quick link to Account Information or Achievements. |
| No active state on sidebar profile sub-items | The dot indicator next to each sub-item never changes to the active color due to the bug described above. Users get no visual feedback about which settings page they are on. |

---

## Proposed Changes

### 1. Fix the sidebar active dot indicator bug

In `AppSidebar.tsx`, the dot element uses a function as className but it's not in a render-prop context. Fix by checking `location.pathname` directly:

```text
// Current (broken):
className={cn("...", ({ isActive }) => isActive ? "bg-primary" : "bg-slate-700")}

// Fixed:
className={cn("...", location.pathname === item.to ? "bg-primary scale-110" : "bg-slate-700")}
```

### 2. Add Achievements to the sidebar

Add a new entry in the main navigation section (after Community) or as a standalone item:

```text
{ to: "/achievements", icon: Trophy, label: "Achievements" }
```

### 3. Add Two-Factor Authentication link

Add a link inside the Account Information page (`ProfileAccountSettings.tsx`) as a new section, or add it as a new sidebar sub-item:

```text
{ to: "/profile/two-factor", icon: ShieldCheck, label: "Two-Factor Auth" }
```

Wire the existing `TwoFactor.tsx` page to this new route (or keep `/two-factor` and just add the sidebar link).

### 4. Fix hardcoded French strings in Account page

Replace "Informations Personnelles" and "Preferences Regionales" in `ProfileAccountSettings.tsx` with `t("profile.personalInfo")` and `t("profile.regionalPreferences")`, and add the corresponding i18n keys.

### 5. Add password change to Account Information

Add a "Change Password" section to `ProfileAccountSettings.tsx` that calls `supabase.auth.updateUser({ password })`. Include current password verification and confirmation field.

### 6. Add i18n to Data and Portability page

Replace all hardcoded strings in `DataPortability.tsx` with `t()` calls and add corresponding keys to `en.json` and `fr.json`.

---

## Technical Summary

| File | Changes |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Fix dot indicator bug (line 286-289); add Achievements to `mainNavItems`; add Two-Factor Auth to `profileSubItems` |
| `src/components/profile/ProfileAccountSettings.tsx` | Replace French hardcoded section titles with i18n; add "Change Password" section; add "Two-Factor Authentication" link/section |
| `src/pages/profile/DataPortability.tsx` | Replace hardcoded English strings with i18n `t()` calls |
| `src/i18n/locales/en.json` | Add keys for `profile.personalInfo`, `profile.regionalPreferences`, `profile.changePassword.*`, `profile.twoFactor.*`, `profile.data.*` |
| `src/i18n/locales/fr.json` | Add matching French translations |

No database migrations needed.

