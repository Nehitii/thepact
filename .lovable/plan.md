

# Focus Module — Full Overhaul: All Fixes + Improvements + No Auto-Fullscreen

## Changes Overview

### 1. Remove Auto-Fullscreen on Session Start
- **`Focus.tsx`**: Remove `enterFullscreen()` call from `handleStart()` and `exitFullscreen()` from `handleEnd()`
- Keep the manual fullscreen toggle button (top-right corner) so users can opt-in if they want
- Fix Escape key: when in fullscreen, first Escape exits fullscreen only; second Escape aborts session

### 2. Delete Dead Code `FocusGoalLinker.tsx`
- Delete `src/components/focus/FocusGoalLinker.tsx`
- Remove its export from `src/components/focus/index.ts`

### 3. Fix Jitter Interval (10ms → 200ms)
- **`FocusTimerRing.tsx` L62**: Change `setInterval(..., 10)` to `setInterval(..., 200)`

### 4. Fix SVG Rotation Performance
- **`FocusTimerRing.tsx` L149**: Replace framer-motion `animate={{ rotate }}` with CSS `animation: spin 60s linear infinite` + `will-change: transform`

### 5. Fix Stale Closures in Keyboard Shortcuts
- **`Focus.tsx`**: Wrap `handlePause`, `handleResume`, `handleEnd` in `useCallback` with proper deps, add them to the keyboard `useEffect` dependency array

### 6. Spotify localStorage Per-User
- **`SpotifyPlayer.tsx`**: Accept `userId` prop, change `STORAGE_KEY` to `focus-spotify-${userId}`
- **`Focus.tsx`**: Pass `user?.id` to `SpotifyPlayer`

### 7. Abort Confirmation Dialog
- **`Focus.tsx`**: Add `showAbortConfirm` state. When user clicks End or presses Escape (while not in fullscreen), show a confirmation dialog instead of immediately ending. Use an AlertDialog.

### 8. Long Break Duration Configurable
- **`FocusConfigPanel.tsx`**: Add a third `DurationRow` for "Long Break" with options `[10, 15, 20, 30]`
- **`Focus.tsx`**: Add `longBreakMin` state, pass to `usePomodoroTimer(workMin, breakMin, longBreakMin)`

### 9. Session Counter Header
- **`Focus.tsx`**: When timer is running, show `Session {sessionsCompleted % 4 + 1}/4` badge near the target badge at the top

### 10. Full i18n (40+ keys)
Add `focus.*` block to both `en.json` and `fr.json`:
- `focus.title`, `focus.systemLabel`, `focus.initSync`, `focus.terminate`, `focus.hyperfocusActive`
- `focus.config.title`, `focus.config.work`, `focus.config.break`, `focus.config.longBreak`
- `focus.stats.today`, `focus.stats.focused`, `focus.stats.streak`, `focus.stats.best`, `focus.stats.weeklyFocus`
- `focus.history.recentSessions`, `focus.history.showAll`, `focus.history.showLess`
- `focus.spotify.add`, `focus.spotify.paste`, `focus.spotify.invalid`, `focus.spotify.pasteHint`
- `focus.controls.resume`, `focus.controls.halt`, `focus.controls.abort`, `focus.controls.overrideControls`
- `focus.ring.standby`, `focus.ring.halted`, `focus.ring.focused`, `focus.ring.cooling`
- `focus.toolbar.config`, `focus.toolbar.spotify`, `focus.toolbar.stats`, `focus.toolbar.history`
- `focus.linker.goal`, `focus.linker.task`, `focus.linker.noGoal`, `focus.linker.noTask`
- `focus.abort.title`, `focus.abort.message`, `focus.abort.confirm`, `focus.abort.cancel`
- `focus.session`, `focus.target`

Then update all 9 focus components to use `useTranslation()` + `t()`.

### 11. Accessibility
- Add `aria-hidden="true"` on all decorative elements (scan lines, corner brackets, ambient effects, vertical text, jitter number)
- Add `role="progressbar"` + `aria-valuenow` + `aria-valuemin/max` on the SVG ring
- Add `focus-visible:ring-2 focus-visible:ring-primary` on all custom `<button>` elements

### 12. FocusHistory — Show Linked Goal/Todo Name
- **`FocusHistory.tsx`**: Accept `goals` and `todos` props, display linked goal/todo name in each session row
- **`Focus.tsx`**: Pass `goals` and `tasks` to `FocusHistory`

---

## Files Impact

| Action | File |
|--------|------|
| **Delete** | `src/components/focus/FocusGoalLinker.tsx` |
| **Edit** | `src/components/focus/index.ts` (remove FocusGoalLinker export) |
| **Edit** | `src/pages/Focus.tsx` (remove auto-fullscreen, useCallback fixes, abort dialog, session counter, long break state, pass props) |
| **Edit** | `src/components/focus/FocusTimerRing.tsx` (jitter 200ms, CSS rotation, a11y, i18n) |
| **Edit** | `src/components/focus/FocusControls.tsx` (i18n, a11y) |
| **Edit** | `src/components/focus/FocusToolbar.tsx` (i18n) |
| **Edit** | `src/components/focus/FocusConfigPanel.tsx` (long break row, i18n) |
| **Edit** | `src/components/focus/FocusStats.tsx` (i18n) |
| **Edit** | `src/components/focus/FocusHistory.tsx` (goal/todo names, i18n) |
| **Edit** | `src/components/focus/SpotifyPlayer.tsx` (per-user localStorage, i18n) |
| **Edit** | `src/components/focus/FocusAmbientEffects.tsx` (aria-hidden) |
| **Edit** | `src/i18n/locales/en.json` (add focus.* block) |
| **Edit** | `src/i18n/locales/fr.json` (add focus.* block) |

No database changes needed.

