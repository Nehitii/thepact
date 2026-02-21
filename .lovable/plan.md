
# Audit and Improvement Plan: Pact Settings Menu

## Current State Audit

The Pact Settings page (`/profile/pact-settings`) consists of 5 sections stacked vertically:

1. **Pact Identity Card** -- Name, Why statement, Symbol picker (4 PactVisual options)
2. **Project Timeline Card** -- Start/End date pickers with save
3. **Custom Difficulty Card** -- Name, color, active toggle for a custom difficulty tier
4. **Ranks Card** -- Full CRUD for XP-based rank progression
5. **Reset Pact (Danger Zone)** -- Destructive reset with confirmation

---

## Issues Found

### A. Bugs and Functional Problems

| Issue | Severity | Details |
|---|---|---|
| Default symbol fallback still emoji | Medium | `PactSettings.tsx` line 16: `useState("🎯")` -- if the DB has no symbol set, the state initializes with an emoji string, which PactVisual cannot render. Should default to `"flame"`. |
| Default symbol fallback on load | Medium | `PactSettings.tsx` line 58: `pactData.symbol \|\| "🎯"` -- same emoji fallback on DB read. Should be `"flame"`. |
| `color` field exists in DB but is unused | Low | The `pacts` table has a `color` column. The `usePact` interface exposes it. The i18n has a `pact.color` key. But the UI has no way to set it, and nothing reads it. |
| Hardcoded English strings | Medium | `PactIdentityCard`, `ProjectTimelineCard`, `CustomDifficultyCard`, and `RanksCard` all have hardcoded English text instead of using i18n `t()` keys. Only the Reset Pact section and the page shell use translations. |
| PactTimeline "Set dates" navigates to `/profile` | Low | `PactTimeline.tsx` line 102: the "Set dates in Pact Settings" button navigates to `/profile` instead of `/profile/pact-settings`. |

### B. Visual and UX Issues

| Issue | Details |
|---|---|
| No live preview of identity | User edits name/mantra/symbol but can't preview what the Home Hero will look like. Adding a mini HeroSection preview would give instant feedback. |
| Inconsistent save patterns | Identity Card has one Save button. Timeline Card has its own Save button. Custom Difficulty has its own. Three separate saves on one page for related data feels fragmented. |
| No Pact color picker | The `color` DB field exists but has no UI. This could let users customize their pact's accent/glow color across the app. |
| No Pact age/stats summary | There's no "Pact Overview" at the top showing creation date, total days active, goals created, points earned -- basic stats about the user's journey. |
| No character count indicators | Name (50 char max) and Mantra (200 char max) have `maxLength` but no visible counter showing remaining characters. |
| Symbol selector has no labels translated | The 4 PactVisual labels ("Flame", "Heart", "Target", "Sparkles") are hardcoded English. |
| PactSettingsCard has unused `useState` import | Minor cleanup. |

### C. Missing Features (Enhancement Opportunities)

| Feature | Impact | Description |
|---|---|---|
| Pact Color Customization | High | Add a color picker that writes to the existing `pacts.color` column. This color could tint the PactVisual glow, the Hero section accent, and rank borders. |
| Pact Stats Overview Card | Medium | A read-only card at the top showing: Pact created date, total days active, total goals, completed goals, current points, current rank, check-in streak. Gives users a sense of their journey. |
| Live Identity Preview | Medium | A mini preview panel showing the PactVisual + name + mantra as it would appear on the Home Hero. |
| Character counters | Low | Show "12/50" and "45/200" under name and mantra inputs. |
| Consolidated Save | Medium | Merge Identity + Timeline into a single save action since they both write to the `pacts` table. Reduces cognitive load from 3 saves to 2. |

---

## Proposed Changes

### 1. Fix emoji fallbacks in `PactSettings.tsx`
- Line 16: Change `useState("🎯")` to `useState("flame")`
- Line 58: Change `pactData.symbol || "🎯"` to `pactData.symbol || "flame"`

### 2. Fix PactTimeline navigation
- `PactTimeline.tsx` line 102: Change `/profile` to `/profile/pact-settings`

### 3. Add Pact Color Picker to `PactIdentityCard.tsx`
- Add a color picker similar to CustomDifficultyCard's, writing to `pacts.color`
- Wire it through the existing prop chain (PactSettings -> ProfilePactSettings -> PactIdentityCard)
- Update `usePactMutation` call in `handleSavePactIdentity` to include `color`

### 4. Add character counters to `PactIdentityCard.tsx`
- Show `{pactName.length}/50` under the name input
- Show `{pactMantra.length}/200` under the mantra textarea

### 5. Add Pact Stats Overview Card
- New component `PactOverviewCard.tsx` placed at the top of ProfilePactSettings
- Reads from `usePact` and `useGoals` hooks to display:
  - Pact creation date
  - Days active
  - Total/completed goals count
  - Current points and rank
  - Check-in streak
- Read-only, no save button needed

### 6. Add Live Identity Preview to `PactIdentityCard.tsx`
- A small preview box at the top of the card showing the PactVisual with the current symbol, the pact name, and mantra as they would appear

### 7. Internationalize all hardcoded strings
- Add i18n keys under `profile.pact.*` for all Pact Settings cards
- Replace hardcoded strings in PactIdentityCard, ProjectTimelineCard, CustomDifficultyCard, and RanksCard with `t()` calls

---

## Technical Summary

| File | Changes |
|---|---|
| `src/pages/profile/PactSettings.tsx` | Fix emoji defaults to `"flame"`, add `pactColor` state, pass to children |
| `src/components/profile/PactIdentityCard.tsx` | Add color picker, character counters, live preview panel, i18n |
| `src/components/profile/ProjectTimelineCard.tsx` | i18n for all strings |
| `src/components/profile/CustomDifficultyCard.tsx` | i18n for all strings |
| `src/components/profile/RanksCard.tsx` | i18n for all strings |
| `src/components/profile/ProfilePactSettings.tsx` | Add PactOverviewCard, pass color props |
| `src/components/profile/PactOverviewCard.tsx` | New component: read-only pact stats summary |
| `src/components/PactTimeline.tsx` | Fix navigation path to `/profile/pact-settings` |
| `src/i18n/locales/en.json` | Add ~30 new i18n keys under `profile.pact.*` |
| `src/i18n/locales/fr.json` | Add matching French translations |

No database migrations needed -- the `color` column already exists in the `pacts` table.
