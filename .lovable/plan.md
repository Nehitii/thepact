

# Guilds, Shared Goals, Shared Pacts & Pact Selector

This is a large multi-system feature. Here is the implementation plan.

---

## 1. Database Migrations

### Guilds system
```sql
CREATE TABLE public.guilds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'shield',
  color text DEFAULT 'violet',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.guild_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- 'owner', 'officer', 'member'
  joined_at timestamptz DEFAULT now(),
  UNIQUE(guild_id, user_id)
);

CREATE TABLE public.guild_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamptz DEFAULT now(),
  UNIQUE(guild_id, invitee_id)
);
```

### Shared Goals
```sql
CREATE TABLE public.shared_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, shared_with_id)
);
```
The `shared_with_id` user gets a read-only copy linked to their pact. The original goal stays editable only by the owner. The shared user sees it with a distinct visual badge.

### Shared Pacts
```sql
CREATE TABLE public.shared_pacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pact_id uuid NOT NULL REFERENCES public.pacts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- 'owner', 'member'
  joined_at timestamptz DEFAULT now(),
  UNIQUE(pact_id, member_id)
);
```

### Active Pact Selector (user preference)
```sql
ALTER TABLE public.profiles ADD COLUMN active_pact_id uuid REFERENCES public.pacts(id) ON DELETE SET NULL;
```

### RLS Policies
- `guilds`: owner can CRUD; members can SELECT.
- `guild_members`: owner/officers can INSERT/DELETE; members can SELECT.
- `guild_invites`: inviter can INSERT; invitee can UPDATE (accept/decline); both can SELECT own.
- `shared_goals`: owner can INSERT/DELETE; `shared_with_id` can SELECT.
- `shared_pacts`: owner can INSERT/DELETE; member can SELECT.
- Security definer functions for cross-table checks.

---

## 2. New Files

| File | Purpose |
|------|---------|
| `src/hooks/useGuilds.ts` | CRUD for guilds, members, invites |
| `src/hooks/useSharedGoals.ts` | Share/unshare goals, fetch shared goals |
| `src/hooks/useSharedPacts.ts` | Create/join shared pacts, list memberships |
| `src/hooks/useActivePact.ts` | Manage active pact selection (personal vs shared) |
| `src/components/friends/GuildCard.tsx` | Guild display card |
| `src/components/friends/GuildCreateModal.tsx` | Create guild dialog |
| `src/components/friends/GuildDetailPanel.tsx` | Members list, invite, manage |
| `src/components/friends/GuildInviteCard.tsx` | Pending invite card |
| `src/components/goals/SharedGoalBadge.tsx` | Visual badge for shared goals |
| `src/components/goals/ShareGoalModal.tsx` | Friend picker to share a goal |
| `src/components/pact/PactSelectorModal.tsx` | Full-screen modal at login to choose active pact |
| `src/components/pact/SharedPactCreateModal.tsx` | Create a shared pact with friends |

---

## 3. Modified Files

### `src/pages/Friends.tsx`
- Add a 4th tab: **Guilds**
- Guild tab shows: user's guilds, pending guild invites, "Create Guild" button
- Each guild card shows name, icon, member count, clickable to expand detail panel

### `src/pages/GoalDetail.tsx` + `src/pages/Goals.tsx`
- Add "Share with friend" button on goal detail (owner only)
- Shared goals show a distinct badge (e.g. chain-link icon + colored border)
- Shared goals received by user are read-only (edit/delete buttons hidden, steps not toggleable)

### `src/hooks/usePact.ts`
- Modify to respect `active_pact_id` from profile
- If `active_pact_id` is set and points to a shared pact the user is member of, load that pact instead of the personal one
- Fallback to personal pact if no `active_pact_id`

### `src/hooks/useGoals.ts`
- Extend to also fetch shared goals for the user's active pact
- Shared goals get an `isShared: true` + `isReadOnly: true` flag in the Goal interface

### `src/components/ProtectedRoute.tsx`
- After auth + 2FA checks, if user has both a personal pact AND shared pact memberships AND no `active_pact_id` set, redirect to `/pact-selector`

### `src/App.tsx`
- Add route `/pact-selector` (protected, no layout) for the PactSelectorModal page

### Goal card components (`GridViewGoalCard`, `BarViewGoalCard`, `UIVerseGoalCard`)
- When `isShared && isReadOnly`: add a subtle chain-link overlay, muted edit controls, and a "Shared by [name]" subtitle

---

## 4. Pact Selector Flow

At login, `ProtectedRoute` checks:
1. User has a personal pact? 
2. User is member of any shared pact?
3. If both exist AND `profiles.active_pact_id` is NULL → redirect to `/pact-selector`
4. The selector shows cards for each available pact (personal + shared) with name, mantra, member count
5. Selecting one sets `active_pact_id` on profiles and redirects to Home
6. A "Switch Pact" button in sidebar/profile allows changing later

---

## 5. Implementation Order

1. DB migrations (all tables + RLS + functions)
2. `useGuilds` hook + Guild tab in Friends page
3. `useSharedGoals` hook + ShareGoalModal + SharedGoalBadge + read-only logic in GoalDetail
4. `useSharedPacts` hook + SharedPactCreateModal
5. `useActivePact` + PactSelectorModal + ProtectedRoute update
6. Visual polish: shared goal card styling, guild cards

