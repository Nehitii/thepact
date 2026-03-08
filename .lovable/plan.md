

## Fix Sidebar Collapsed Mode — Compact & Clean

### Problem
In collapsed mode, the Modules and User Settings sections render as a long list of tiny icons that look broken and glitchy. The spacing, separators, and overflow create visual noise.

### Solution: Compact Popover Approach
In mini mode, replace the Modules and Settings icon lists with **two single icon buttons** that each open a **Popover** containing the full list of items. The main nav icons remain as-is (already clean).

### Changes — `src/components/layout/AppSidebar.tsx`

**1. Modules section (lines 282-335) — mini branch**
- Instead of rendering all module icons inline, render a single `Package` icon button
- On click → `Popover` opens to the right showing the module list with labels
- Wrapped in `MaybeTooltip` showing "Modules"

**2. Settings section (lines 338-401) — mini branch**
- Instead of rendering all 7 profile sub-item icons, render a single `Settings` icon button
- On click → `Popover` opens to the right with the full settings nav list
- Wrapped in `MaybeTooltip` showing "Settings"

**3. "Explore modules" teaser (lines 322-335)**
- In mini mode: show a single `Sparkles` icon button with tooltip, navigates to `/shop`

**4. Separator cleanup**
- Remove the bare `<div className="h-px ...">` separators in mini mode (lines 294, 341)
- Use a single clean separator before the popover buttons

### Visual result in collapsed mode

```text
┌──────┐
│  P   │  ← logo
│ ‹/›  │  ← collapse toggle
├──────┤
│  🏠  │  Home
│  🎯  │  Goals
│  ⏱   │  Focus
│  📊  │  Analytics
│  🏆  │  Achievements
│  👑  │  Leaderboard
│  🤝  │  Friends (badge)
│  ✉️  │  Inbox (badge)
│  🛍  │  Shop
│  👥  │  Community
├──────┤
│  📦  │  → Popover: Module list
│  ⚙️  │  → Popover: Settings list
├──────┤
│  👤  │  ← avatar/footer
└──────┘
```

### Technical details
- Import `Popover, PopoverContent, PopoverTrigger` from `@/components/ui/popover`
- Import `Package` icon from lucide-react for the modules button
- Each popover item is a `NavLink` with active styling, clicking closes the popover via state
- The expanded mode remains completely unchanged

### Files
| File | Action |
|------|--------|
| `src/components/layout/AppSidebar.tsx` | Edit — refactor mini mode for modules + settings |

