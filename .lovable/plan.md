

## Audit — `/focus` (Focus Timer)

### Current State
The page is functional but visually bare compared to the rest of the app (Health, The Call, Goals). It's a basic Pomodoro timer with a circular progress ring, start/stop controls, duration selectors, and two stat cards. No `ModuleHeader`, no ambient effects, no session history, no goal linking, no pause capability.

### Issues Identified

1. **No ModuleHeader** — Every other module uses the shared `ModuleHeader` with rotating rings and system label. Focus doesn't, breaking visual consistency.
2. **No pause/resume** — The hook has `pause`/`resume` but the UI only shows Start or Stop (destructive reset). No way to pause mid-session.
3. **Flat layout** — No glassmorphism, no ambient glow, no scan lines, no cyber background. Looks like a different app.
4. **No goal/task linking** — The DB schema supports `linked_goal_id` and `linked_todo_id` but the UI doesn't use them. Users can't associate a focus session with what they're working on.
5. **No session history** — Hook fetches last 50 sessions but the UI only shows today's count/minutes. No way to review past sessions.
6. **Timer circle too plain** — Single stroke, no glow pulse, no secondary decorative rings, no phase-transition animation.
7. **No audio/haptic cue** — Session end has no notification (the app has a sound system via `SoundContext`).
8. **Stats cards are minimal** — Only 2 cards (count + minutes). No streak, no weekly trend, no best day.

---

### Proposed Redesign

#### 1. Adopt ModuleHeader
Replace the custom header with `ModuleHeader` (`title="FOCUS"`, `titleAccent=" MODE"`, `systemLabel="DEEP_WORK // POMODORO"`, `badges=[]`).

#### 2. Redesign Timer Ring (Cyber aesthetic)
- Double concentric rings: outer = progress, inner = decorative pulsing ring.
- Glow effect intensifies as session progresses.
- Phase indicator badge inside circle with animated icon swap (Flame → Coffee).
- Add a subtle rotating dashed ring behind (reuse `RotatingRing` from JournalDecorations).
- Ambient particle dots around the circle during active sessions.

#### 3. Full Control Bar
Replace binary Start/Stop with a proper control strip:
- **Idle**: `[▶ START SESSION]` large CTA button.
- **Running**: `[⏸ Pause]` `[⏭ Skip]` `[⏹ End]` — three distinct actions.
- **Paused**: `[▶ Resume]` `[⏹ End]` — two actions.
- Style: glassmorphic bar (`bg-card/60 backdrop-blur border border-border/50 rounded-2xl`).

#### 4. Goal/Task Linking
- Add optional selector above the timer (only in idle): "Link to..." dropdown showing focus goals + active todos.
- When linked, display the goal/task name below the timer during session.
- Save `linked_goal_id` / `linked_todo_id` in the session record.

#### 5. Session Config Panel (improved)
- Keep duration selectors but wrap in a collapsible `⚙ Config` panel (like Health settings).
- Add: long break duration (after 4 sessions), auto-start next session toggle.
- Persist settings to `localStorage` or a new DB column.

#### 6. Enhanced Stats Section
Replace 2 flat cards with a richer stats strip:
- **Today**: sessions count, total minutes, current streak (consecutive days with ≥1 session).
- **Weekly sparkline**: 7-day bar chart of focus minutes (reuse Recharts).
- **Best session**: longest uninterrupted work block.
- Wrap in `bg-card/40 backdrop-blur border rounded-2xl`.

#### 7. Session History Panel
- Collapsible "Recent Sessions" below stats.
- Each row: date, duration, linked goal name, completed badge.
- Max 10 rows with "show more".

#### 8. Sound Integration
- Play `ui-click.mp3` on start/pause.
- Add a distinct chime on session complete (can reuse existing sound or add a new one).
- Respect the global sound setting from `SoundContext`.

#### 9. Ambient Background
- During active session: subtle scan lines + primary-colored vignette (like FocusOverlay but lighter).
- Idle: standard page background.

---

### Files to modify
- `src/pages/Focus.tsx` — full rewrite of layout, controls, stats, history, goal linking
- `src/hooks/usePomodoro.ts` — add pause state tracking, expose `isPaused`
- Potentially add `src/components/focus/` folder for extracted sub-components (TimerRing, FocusStats, SessionHistory, GoalLinker)

### Files to read (no changes)
- `src/contexts/SoundContext.tsx` — for sound integration
- `src/hooks/useGoals.ts` — for goal linking dropdown
- `src/hooks/useTodoList.ts` — for task linking dropdown

### No DB migration needed
The `pomodoro_sessions` table already has `linked_goal_id`, `linked_todo_id`, `notes` columns.

