

# Implementation Plan — Settings Enhancements

The user approved all proposals **except** the two PCT.02 items (Pact Color Theme, Default Goal View). Here's what we'll implement:

---

## 1. ACC.01 — Delete Account (Danger Zone)

**Database**: Create edge function `supabase/functions/delete-account/index.ts` that:
- Verifies the user is authenticated
- Deletes all user data (pacts, goals, steps, finance, etc.) in correct FK order
- Calls `auth.admin.deleteUser()` to remove auth record

**UI**: Add a collapsible "DANGER ZONE" `DataPanel` at the bottom of `ProfileAccountSettings.tsx`:
- Red-bordered panel with "Delete Account" button
- Confirmation modal requiring the user to type "DELETE" to confirm
- Calls the edge function, then signs out

## 2. ACC.01 — Active Sessions & Login History

**UI**: Add a new `DataPanel` in `ProfileAccountSettings.tsx`:
- Show `security_events` table entries (already exists!) filtered by login-type events
- Display device label, date, event type
- "Sign out all other sessions" button that calls `supabase.auth.signOut({ scope: 'others' })`

*No DB changes needed* — `security_events` table already exists.

## 3. DSP.03 — Accent Color Picker

**Database**: Migration to add `accent_color text default '#5bb4ff'` to `profiles`.

**UI** (`DisplaySound.tsx`): New `DataPanel` MODULE_04 with a grid of 8 preset accent colors. On selection, saves to profile and applies a CSS variable `--accent-color` on `:root`.

**Hook**: Update `useProfileSettings` to include `accent_color` in the select and type.

**Root effect**: Add a `useEffect` in `AppProviders.tsx` or a new `AccentColorSync` component that reads the profile's `accent_color` and sets `document.documentElement.style.setProperty('--color-primary', ...)`.

## 4. DSP.03 — Font Size Slider

**Database**: Add `font_size integer default 16` to `profiles`.

**UI** (`DisplaySound.tsx`): New `SettingContentRow` with a slider (12-24px) in the Visual panel.

**Root effect**: Same sync component sets `document.documentElement.style.fontSize`.

## 5. DSP.03 — Sound Preview

**UI** (`DisplaySound.tsx`): Add a small play button (▶) next to each sound toggle row. On click, plays the corresponding sound file from `/sounds/` using `new Audio()`.

*No DB changes needed.*

## 6. NTF.04 — Quiet Hours

**Database**: Add `quiet_hours_start time default null`, `quiet_hours_end time default null` to `notification_settings`.

**UI** (`NotificationSettings.tsx`): New `DataPanel` MODULE_03 with two time selectors (start/end) for DND hours. Uses `<Select>` with hour options.

## 7. PRV.05 — Blocked Users

**Database**: New table `blocked_users (id, user_id, blocked_user_id, created_at)` with RLS.

**UI**: New `BlockedUsersPanel.tsx` component added as a `DataPanel` in `PrivacyControl.tsx`. Lists blocked users with unblock button. Uses a query on `blocked_users` joined with `profiles` for display names.

## 8. PRV.05 — Shared Data Overview

**UI**: New `DataPanel` in `PrivacyControl.tsx` showing:
- Shared goals count (from `shared_goals` if exists, or goals with `is_shared`)
- Shared pacts (from `shared_pacts` table)
- Option to revoke sharing per item

*No DB changes needed* — uses existing tables.

## 9. DAT.06 — Import Data

**UI** (`DataPortability.tsx`): New `DataPanel` with file upload accepting `.json`. Parses the exported format and upserts data back into respective tables. Shows a preview of what will be imported before confirming.

## 10. DAT.06 — Delete All Data

**UI** (`DataPortability.tsx`): "DANGER ZONE" panel with "Delete All Data" button. Calls an edge function that deletes all user content but keeps the account. Requires typing "RESET" to confirm.

**Edge function**: `supabase/functions/delete-all-data/index.ts` — same as delete-account but skips `auth.admin.deleteUser()`.

---

## Database Migration (single SQL)

```sql
ALTER TABLE profiles ADD COLUMN accent_color text NOT NULL DEFAULT '#5bb4ff';
ALTER TABLE profiles ADD COLUMN font_size integer NOT NULL DEFAULT 16;

ALTER TABLE notification_settings ADD COLUMN quiet_hours_start time DEFAULT NULL;
ALTER TABLE notification_settings ADD COLUMN quiet_hours_end time DEFAULT NULL;

CREATE TABLE blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks" ON blocked_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can block others" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unblock" ON blocked_users FOR DELETE USING (auth.uid() = user_id);
```

## Files to Create
- `supabase/functions/delete-account/index.ts`
- `supabase/functions/delete-all-data/index.ts`
- `src/components/profile/BlockedUsersPanel.tsx`
- `src/components/profile/AccentColorSync.tsx`

## Files to Modify
- `src/components/profile/ProfileAccountSettings.tsx` — Add Danger Zone + Sessions panels
- `src/pages/profile/DisplaySound.tsx` — Accent color, font size, sound preview
- `src/pages/profile/NotificationSettings.tsx` — Quiet hours panel
- `src/pages/profile/PrivacyControl.tsx` — Blocked users + shared data panels
- `src/pages/profile/DataPortability.tsx` — Import + delete all data panels
- `src/hooks/useProfileSettings.ts` — Add accent_color, font_size to type/select
- `src/components/AppProviders.tsx` — Mount AccentColorSync

