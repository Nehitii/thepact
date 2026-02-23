

# Complete Site Audit -- Pacte Application

## 1. BUGS (Must Fix)

### 1.1 Missing i18n Keys (Console Warnings)
The console is flooding with warnings for `profile.twoFactor.title`, `profile.twoFactor.description`, and `profile.twoFactor.manage`. The code in `ProfileAccountSettings.tsx` uses `t("profile.twoFactor.title", { defaultValue: ... })` but the keys don't exist in `en.json` or `fr.json` -- the `twoFactor` object is at root level, not nested under `profile`.

**Fix:** Add a `twoFactor` sub-object inside the `profile` key in both `en.json` and `fr.json`:
```json
"profile": {
  "twoFactor": {
    "title": "Two-Factor Authentication",
    "description": "Add an extra layer of security to your account.",
    "manage": "Manage"
  }
}
```

### 1.2 Resend Email 2FA Fails for Non-Sandbox Users
The Resend API key is in sandbox mode, meaning emails can only be sent to the account owner's email address. Any other user activating email 2FA will get a 500 error.

**Fix:** Verify a custom domain on [resend.com/domains](https://resend.com/domains), then set the `RESEND_FROM_EMAIL` secret to use that domain (e.g., `Pacte <noreply@yourdomain.com>`). Until then, email 2FA is effectively broken for all users except the Resend account owner.

### 1.3 TwoFactor Page Wrapped in AppLayout (Incorrect)
The `/two-factor` route uses `ProtectedWithLayout`, which wraps it in the full sidebar layout. But the 2FA verification gate should be a full-screen, standalone page (like `/auth`) -- users shouldn't see the sidebar when they haven't completed verification yet. This also creates a visual bug where the sidebar is visible but all links redirect back to `/two-factor`.

**Fix:** Change the `/two-factor` route back to use just `ProtectedRoute` without `AppLayout`.

### 1.4 TOTP "Manage" Button Navigates to Verification Gate
The TOTP section's "Manage" button in `ProfileAccountSettings` navigates to `/two-factor`, which is the verification gate -- not a management page. If the user has already verified, they'll just be redirected back since `isRequired` is false.

**Fix:** The "Manage" button should navigate to a dedicated 2FA settings/management page, or open an inline panel for enabling/disabling TOTP and managing recovery codes.

---

## 2. CORRECTIONS (Should Fix)

### 2.1 Hardcoded French Strings
Several UI strings are hardcoded in French instead of using i18n:
- Home page: "Initialisation...", "MODE EDITION ACTIVE", "Reorganisez votre tableau de bord", "Modules Disponibles"
- Onboarding page: "Welcome to Pacte" is in English but other text is hardcoded
- The Call page: French comments and variable names throughout

**Fix:** Move all user-facing strings to the i18n files.

### 2.2 `dangerouslySetInnerHTML` for CSS Injection
`AppSidebar.tsx` and `Achievements.tsx` inject CSS via `dangerouslySetInnerHTML`. While the content is static strings (safe), this is an anti-pattern.

**Fix:** Move the CSS to `index.css` or use a Tailwind plugin.

### 2.3 Journal Entry XSS Risk
`JournalEntryCard.tsx` renders `entry.content` via `dangerouslySetInnerHTML`. If the content comes from a rich text editor (TipTap), it should be sanitized before rendering.

**Fix:** Add a sanitizer like DOMPurify to sanitize HTML before rendering journal entries.

### 2.4 Inconsistent Error Handling
- `StepDetail.tsx` has hardcoded English error strings ("Failed to load step details")
- `Legal.tsx` uses `toast` from `sonner` directly while the rest of the app uses `useToast` from the custom hook
- Some `catch` blocks show `error.message` directly to users, which can leak implementation details

**Fix:** Standardize on one toast system and use i18n for all error messages.

### 2.5 Admin Routes Not Protected
Admin routes (`/admin`, `/admin/cosmetics`, etc.) use `ProtectedWithLayout` which only checks authentication, not the admin role. Any authenticated user could access admin pages.

**Fix:** Create an `AdminRoute` wrapper that checks `has_role(user_id, 'admin')` before rendering.

---

## 3. IMPROVEMENTS (Nice to Have)

### 3.1 QueryClient Configuration
The `QueryClient` is created with default settings -- no default `staleTime`, `retry`, or `gcTime`. This means every component re-fetches on mount.

**Fix:** Set sensible defaults like `staleTime: 30_000` and `retry: 1`.

### 3.2 Two Supabase Client Instances
The codebase has two Supabase client files: `src/lib/supabase.ts` and `src/integrations/supabase/client.ts`. This is confusing and could lead to inconsistencies.

**Fix:** Remove `src/lib/supabase.ts` and use only the auto-generated client from `src/integrations/supabase/client.ts` everywhere.

### 3.3 Heavy Home Page
The Home page loads 15+ hooks and many components on every render. The `useMemo` block computing dashboard data is ~90 lines of synchronous computation.

**Fix:** Consider splitting the dashboard data computation into smaller, memoized hooks. Lazy-load modules that are below the fold.

### 3.4 Missing Loading/Error States
The `TwoFactorSection` in profile settings doesn't show a loading state while the 2FA status is being fetched, which can cause flickering.

### 3.5 Sidebar Doesn't Use Standard SidebarProvider
The `AppSidebar` renders a custom `<aside>` instead of using Shadcn's `<Sidebar>` component. While it works, it means features like sidebar collapse, keyboard shortcuts, and responsive behavior must be manually implemented.

### 3.6 Missing `<meta>` Tags
The `index.html` likely lacks proper meta tags for SEO, OG images, and mobile viewport configuration beyond the basic defaults.

---

## 4. SECURITY NOTES

### 4.1 Database Linter: Clean
No RLS issues found. All tables have proper policies.

### 4.2 Edge Function Auth: Solid
The `two-factor` edge function properly validates tokens, uses `supabaseAdmin` for sensitive operations, and has rate limiting. The 401 retry/signout pattern is well implemented.

### 4.3 Recovery Code Generation: Good
Uses cryptographically random bytes, SHA-256 hashing, and single-use enforcement.

---

## Priority Summary

| Priority | Item | Effort |
|----------|------|--------|
| Critical | 1.2 Resend sandbox (domain verification) | User action required |
| Critical | 1.3 Two-factor page should not have sidebar | 2 min |
| High | 1.1 Missing i18n keys (console warnings) | 5 min |
| High | 1.4 TOTP "Manage" button goes to wrong page | 15 min |
| High | 2.5 Admin routes not role-protected | 20 min |
| Medium | 2.3 Journal entry XSS sanitization | 15 min |
| Medium | 2.1 Hardcoded French strings | 30 min |
| Medium | 2.4 Inconsistent toast/error handling | 20 min |
| Low | 2.2 Remove dangerouslySetInnerHTML for CSS | 10 min |
| Low | 3.1-3.6 Various improvements | Variable |

