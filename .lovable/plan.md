

# Reset Pact Function -- Delete All Goals & Steps

## What It Does
Adds a "Reset Pact" function that wipes all goals, steps, and related data for a user's pact, bringing it back to a fresh state. The pact itself is preserved (name, mantra, symbol stay), but all progress data is cleared.

## Data Cascade

When resetting, the following tables need cleanup (in dependency order):

```text
pact (kept)
  |
  +-- goals (deleted)
  |     |-- steps (deleted via FK cascade or manually)
  |     |     +-- step_status_history (deleted via FK cascade)
  |     |-- goal_tags (deleted via FK cascade)
  |     |-- goal_cost_items (deleted via FK cascade)
  |     +-- active_missions (deleted -- references goal_id)
  |
  +-- pact fields reset:
        - points -> 0
        - global_progress -> 0
        - checkin_streak -> 0
        - checkin_total_count -> 0
```

## Implementation

### Step 1: Database Function (Migration)

Create a `SECURITY DEFINER` function `reset_pact_data(p_pact_id UUID)` that:
1. Verifies the caller owns the pact (`auth.uid() = user_id`)
2. Deletes all `active_missions` for the user (they reference goals)
3. Deletes all `goals` where `pact_id = p_pact_id` (FK cascades handle steps, tags, cost_items, step_status_history)
4. Resets pact counters: `points = 0`, `global_progress = 0`, `checkin_streak = 0`, `checkin_total_count = 0`
5. Resets `achievement_tracking` counters for the user back to 0
6. Returns a success indicator

Using a single DB function ensures atomicity -- either everything resets or nothing does.

### Step 2: Client Hook -- `useResetPact`

New hook in `src/hooks/useResetPact.ts`:
- Calls `supabase.rpc("reset_pact_data", { p_pact_id: pactId })`
- Invalidates all relevant React Query caches: `["pact"]`, `["goals"]`, `["ranks"]`, `["active-mission"]`
- Shows success/error toast

### Step 3: UI -- Add Reset Button to Pact Settings

In `ProfilePactSettings` (or `PactSettingsCard`), add a "Reset Pact" danger button:
- Guarded by an AlertDialog confirmation with explicit warning text
- Requires typing the pact name to confirm (prevents accidental resets)
- Shows loading state during the operation

## Technical Details

**Database function:**
```text
CREATE OR REPLACE FUNCTION public.reset_pact_data(p_pact_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_user_id
  FROM pacts WHERE id = p_pact_id;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Delete active missions (references goals)
  DELETE FROM active_missions WHERE user_id = v_user_id;

  -- Delete all goals (FK cascades handle steps, tags, cost_items, history)
  DELETE FROM goals WHERE pact_id = p_pact_id;

  -- Reset pact counters
  UPDATE pacts SET
    points = 0,
    global_progress = 0,
    checkin_streak = 0,
    checkin_total_count = 0
  WHERE id = p_pact_id;

  -- Reset achievement tracking
  UPDATE achievement_tracking SET
    total_goals_created = 0, easy_goals_created = 0,
    medium_goals_created = 0, hard_goals_created = 0,
    extreme_goals_created = 0, impossible_goals_created = 0,
    custom_goals_created = 0, goals_completed_total = 0,
    easy_goals_completed = 0, medium_goals_completed = 0,
    hard_goals_completed = 0, extreme_goals_completed = 0,
    impossible_goals_completed = 0, custom_goals_completed = 0,
    steps_completed_total = 0
  WHERE user_id = v_user_id;

  RETURN TRUE;
END;
$$;
```

**Files to create/modify:**
- `supabase/migrations/` -- new migration with the `reset_pact_data` function
- `src/hooks/useResetPact.ts` -- new hook
- `src/components/profile/PactSettingsCard.tsx` -- add reset button with confirmation dialog

