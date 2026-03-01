

# Home Page Audit -- Fixes Required

## Issues Found

After a full audit of the Home page, the page loads and all components render with live data from the database. No build errors or runtime exceptions. However, several data accuracy and logic issues need fixing:

---

## Fix 1: DifficultyScalePanel Shows Wrong Metric

The difficulty cards currently display `completed` goals count per difficulty. But looking at the data, the numbers shown (EASY: 01, HARD: 05, EXTREME: 04) don't match the achievement tracking which says 0 goals completed total. 

The issue is in `Home.tsx` line 53: `completedGoals` filters by `fully_completed` status, but the `DifficultyScalePanel` receives this and shows `item?.completed`. The reference design shows **total** goals per difficulty (not completed ones). The fix: change `DifficultyScalePanel` to show `total` instead of `completed`, or show both. The card's large number should represent total goals in that category.

**File**: `src/components/home/DifficultyScalePanel.tsx` -- change `count` from `item?.completed` to `item?.total`

---

## Fix 2: Timeline Markers Don't Scale to Pact Duration

The monitoring panel timeline hardcodes markers as `J.01, J.10, J.15, J.25, J.30`. But this user's pact spans **2251 days** (Nov 2023 to Dec 2029). The markers are meaningless for such a long duration. 

**File**: `src/components/home/MonitoringGlobalPanel.tsx` -- compute markers dynamically based on `totalDays`, e.g., show `J.1`, `J.${Math.round(totalDays*0.25)}`, `J.${Math.round(totalDays*0.5)}`, etc.

---

## Fix 3: "Classe S" Hardcoded in RankPanel

The RankPanel shows "Classe S" and "TIER 1 . CLASSE S" as static text regardless of actual rank data. This should be dynamic -- either computed from the tier/level number, or removed if the data model doesn't support it.

**File**: `src/components/home/RankPanel.tsx` -- replace hardcoded "Classe S" with a computed value, e.g., "Classe {level}" or derive from rank tier

---

## Fix 4: Missing Bond/Currency Display in NeuralBar

The reference design shows a bond currency counter (icon + number) to the left of the CUSTOMIZE button. The current NeuralBar has frequency bars and the customize button, but no bond display.

**File**: `src/components/home/NeuralBar.tsx` -- add a BondIcon + bond count display. Data source: use the `useCurrency` or query `profiles.bonds` (need to check if this field exists, or use the shop currency context).

---

## Fix 5: NeuralBar Needs Pact Name Display

The reference shows the pact name/ID in the left section of the NeuralBar (after the SYS progress bar). Currently it shows GPS coordinates instead. These should be replaced with the pact name and a truncated ID.

**File**: `src/components/home/NeuralBar.tsx` -- replace `LAT 48.8566 / LON 2.3522` with `{pact.name} // ID:{pact.id.slice(0,8)}`

---

## Summary of Changes

| File | Change |
|------|--------|
| `DifficultyScalePanel.tsx` | Show `total` instead of `completed` in the large number |
| `MonitoringGlobalPanel.tsx` | Dynamic timeline markers based on actual pact duration |
| `RankPanel.tsx` | Replace hardcoded "Classe S" with computed value |
| `NeuralBar.tsx` | Add bond display + replace GPS coords with pact name/ID |

All changes are cosmetic/data-display fixes. No database changes needed. No new files.

