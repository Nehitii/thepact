

## Plan — Health module improvements

### 1. Remove SCORE & TREND hexagons from header
**File**: `src/pages/Health.tsx` (lines 115-118)
- Set `badges={[]}` on the `ModuleHeader`, same as done for The Call.

### 2. Move CSV Export to Profile > Data & Portability
**Files**:
- `src/pages/Health.tsx` — Remove the `HealthDataExport` import and its usage from the command bar (lines 131-140).
- `src/pages/profile/DataPortability.tsx` — Add a new export option `"health"` to the `ExportCategory` type and `exportOptions` array. Reuse the CSV export logic from `HealthDataExport.tsx` inside the existing export flow (query `health_data`, generate CSV, download). Add the health category with a Heart/Activity icon.

### 3. Center the VitalsSummaryStrip labels
**File**: `src/pages/Health.tsx` (line 348)
- Change the `VitalsSummaryStrip` inner `div` from `flex gap-4` to `flex gap-4 justify-center` so "Sleep - Activity - Stress - Hydration" are centered.

### 4. Fix "STATUS: Critical" overflowing the rotating circles
**File**: `src/components/health/HealthScoreCard.tsx` (lines 111-130)
- The inner `div` positioned `absolute inset-0` contains text that can exceed the SVG viewbox circle boundaries. Fix by adding `overflow-hidden` and constraining the text container width (e.g., `max-w-[100px]`) or reducing font size of "STATUS: CRITICAL" text. Specifically, truncate/scale the status text with `text-[9px]` and `whitespace-nowrap` to prevent overflow.

### 5. Add "Check-in mode" setting (today vs. yesterday)
**DB migration**: Add column `checkin_mode` (`text`, default `'today'`) to `health_settings` table.

**Files**:
- `src/hooks/useHealth.ts` — Add `checkin_mode` to `HealthSettings`, `HealthSettingsInput` interfaces.
- `src/components/health/HealthSettingsModal.tsx` — Add a new toggle/radio in the Config modal: "Daily check-in concerne" → "Aujourd'hui" / "Hier". Save as `checkin_mode: 'today' | 'yesterday'`.
- `src/components/health/HealthDailyCheckin.tsx` — Read the `checkin_mode` setting. When mode is `'yesterday'`, compute `entry_date` as yesterday's date (`format(subDays(new Date(), 1), 'yyyy-MM-dd')`) and pass it to `useUpsertHealthData`. Also load yesterday's existing data instead of today's via `useTodayHealth` (or a date-parameterized query). Display the target date in the dialog header.
- `src/hooks/useHealth.ts` — Adjust `useTodayHealth` or add a `useHealthByDate` variant that accepts a date parameter so the check-in can load the correct day's data.

### Technical summary
- 1 DB migration (add `checkin_mode text default 'today'` to `health_settings`)
- 5 files modified: `Health.tsx`, `HealthScoreCard.tsx`, `HealthSettingsModal.tsx`, `HealthDailyCheckin.tsx`, `useHealth.ts`
- 1 file modified: `DataPortability.tsx` (add health CSV export category)

