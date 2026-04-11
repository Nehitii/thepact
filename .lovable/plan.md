

# TCG Rarity Halo Effect on Goal Cards

## Concept
A Hearthstone-inspired animated halo that appears on hover, with intensity and style scaling by difficulty (rarity tier):

| Difficulty | Rarity | Halo Style |
|-----------|--------|------------|
| easy | Common | Subtle green outer glow, no animation |
| medium | Uncommon | Yellow glow with slow pulse |
| hard | Rare | Orange glow with faster pulse + faint rotating ring |
| extreme | Epic | Red glow with animated rotating gradient border |
| impossible/custom | Legendary | Purple/custom glow with double rotating rays + sparkle particles |

## Implementation

### 1. New CSS in `index.css` — Rarity Halo System
Add `@keyframes` and `.rarity-halo` classes:
- `.rarity-halo` — base pseudo-element (`::before`) positioned behind the card with `filter: blur()` and the card's `--accent-rgb` color
- On hover: scales up opacity + blur radius based on a `--halo-intensity` CSS var (1-5 mapped from difficulty)
- `.rarity-halo--animated` — adds a rotating `conic-gradient` overlay (`::after`) for epic/legendary tiers
- `.rarity-halo--legendary` — adds a second animation layer with pulsing rays via a radial burst pattern
- All animations respect `prefers-reduced-motion` (static glow only)

### 2. Edit `GridViewGoalCard.tsx`
- Add `rarity-halo` class to the outer `<article>` element
- Set `--halo-intensity` CSS var based on `getDifficultyIntensity`
- Add `rarity-halo--animated` class when intensity >= 4

### 3. Edit `UIVerseGoalCard.tsx`
- Same approach: add halo classes to the root `motion.div`
- Set `--halo-intensity` from existing `intensity` variable

### 4. Edit `BarViewGoalCard.tsx`
- Add halo classes to `.bar-card-root` div
- Set `--halo-intensity` via existing CSS vars

### 5. Edit `FocusGoalsModule.tsx`
- Add a lighter version of the halo to the mini goal cards in the home dashboard focus module

## Technical Details
- Pure CSS approach (no extra Framer Motion) for performance
- Uses existing `--accent-rgb` variables already on every card
- Single `::before` pseudo-element with `blur(20-40px)` for the glow
- `::after` for the rotating gradient ring on epic+ tiers
- `transition` on hover for smooth fade-in (300ms)
- `@media (prefers-reduced-motion: reduce)` disables rotation, keeps static glow

## Files
| Action | File |
|--------|------|
| **Edit** | `src/index.css` — add rarity halo keyframes + classes |
| **Edit** | `src/components/goals/GridViewGoalCard.tsx` — apply halo classes |
| **Edit** | `src/components/goals/UIVerseGoalCard.tsx` — apply halo classes |
| **Edit** | `src/components/goals/BarViewGoalCard.tsx` — apply halo classes |

