

# /Home Analysis & Improvement Plan

## Short Diagnosis

### Current State Analysis

The `/Home` page is a **feature-rich modular dashboard** with strong visual identity (sci-fi/HUD aesthetic), but suffers from several key issues that diminish its effectiveness as a "personal command center":

**Strengths:**
- Strong visual identity with consistent glassmorphism and glow effects
- Solid modular architecture (drag-drop, resize, visibility toggles)
- Good gamification elements (XP, Rank, Level)
- Clear core identity section (Pact symbol, name, mantra)

**Core Issues:**

1. **Information Overload**: 14+ modules competing for attention with no visual hierarchy. Everything glows equally, reducing overall impact.

2. **No User State Adaptation**: New users, active users, and advanced users see the exact same dashboard. A fresh user with 0 goals sees empty gauges rather than onboarding prompts.

3. **Weak "Next Action" Clarity**: No clear CTA or "what should I do now?" guidance. The dashboard shows data but doesn't drive action.

4. **Redundant Metrics**: Goals Completed, Steps Completed, and Status Summary all display overlapping goal data, creating cognitive noise.

5. **Poor Mobile Experience**: Fixed width modules and complex grid become cramped on smaller screens.

6. **Locked Modules Friction**: Unpurchased modules show "Unlock in Shop" but still consume valuable space and create visual clutter.

7. **Cross-Module Disconnection**: Health, Finance, Journal, and Todo modules don't surface insights on Home—they're just navigation buttons.

---

## Prioritized Improvement Ideas

### Priority 1 — Hero Zone Redesign (High Impact)

**Problem**: The core Pact section is beautiful but passive. Three HUD panels (XP, Rank, Level) are visually similar and lack context.

**Solution**:
- Add a **"Today's Focus"** contextual message below the mantra (e.g., "3 steps remaining on Goal X" or "Validation pending in Finance")
- Replace the 3-column stats grid with a **single "Next Milestone" card** showing:
  - XP to next rank
  - Days remaining if timeline is active
  - Primary focus goal progress
- Add subtle micro-animation to the rank panel when user is close to leveling up

---

### Priority 2 — Smart Dashboard Sections (User-State Adaptive)

**Problem**: Empty gauges for new users; overwhelming data for advanced users.

**Solution**: Introduce 3 adaptive states:

| User State | Criteria | Dashboard Behavior |
|------------|----------|-------------------|
| **Onboarding** | 0-1 goals, <7 days | Show "Getting Started" card with guided steps |
| **Active** | 2+ goals, in-progress | Show standard modules + "Quick Actions" bar |
| **Advanced** | 5+ completed goals | Unlock "Insights" panel with trends |

**Implementation**:
- Calculate user state in `useMemo` based on `allGoals`, pact creation date
- Render conditional sections based on state
- "Getting Started" card prompts: "Create your first goal", "Set project timeline", "Explore the shop"

---

### Priority 3 — Module Consolidation & Visual Hierarchy

**Problem**: Goals Gauge, Steps Gauge, and Status Summary all show goal-related metrics. Progress by Difficulty and Cost Tracking are secondary.

**Solution**:
1. **Merge Goals + Steps into a single "Progress Overview" module** with:
   - Dual progress rings (goals outer, steps inner)
   - Single glanceable metric
2. **Demote Status Summary** to an expandable detail within Progress Overview
3. **Create visual hierarchy** with 3 tiers:
   - **Primary** (larger, top): Focus Goals, Progress Overview
   - **Secondary** (medium): Timeline, Achievements
   - **Tertiary** (smaller, bottom): Action modules (Finance, Todo, etc.)

---

### Priority 4 — Quick Actions Bar

**Problem**: No clear "next action" from the dashboard.

**Solution**: Add a floating/sticky "Quick Actions" section below the hero:

```
[ + New Goal ]  [ ✓ Log Todo ]  [ 📝 Journal Entry ]  [ 💪 Health Check-in ]
```

- Only show buttons for purchased modules
- On mobile: horizontal scroll
- Subtle entrance animation

---

### Priority 5 — Module Insights Integration

**Problem**: Purchased modules (Finance, Health, Todo) only show navigation buttons, not data.

**Solution**: Display **live mini-insights** for owned modules:

| Module | Home Insight |
|--------|-------------|
| **Finance** | "€450 remaining to goal" or "Validation due in 3 days" |
| **Health** | Today's health score (if checked in) or "Check-in available" |
| **Todo** | "4 tasks due today" with priority count |
| **Journal** | "Last entry: 2 days ago" |

**Implementation**: Extend each module component to accept an `insightMode` prop for compact data display.

---

### Priority 6 — Locked Module Handling

**Problem**: Locked modules take up space and add visual noise.

**Solution**:
1. **Group locked modules** into a single "Unlock More" teaser card at the bottom
2. Show 2-3 module icons with "Discover more in Shop →"
3. Remove individual locked module cards from the main grid

---

### Priority 7 — Focus Goals Enhancement

**Problem**: Focus Goals section is buried; starred goals lack priority distinction.

**Solution**:
1. Move Focus Goals to **directly below hero** (after Quick Actions)
2. Add **priority ranking** (1, 2, 3) to starred goals
3. Show **today's next step** for the #1 focus goal
4. Add "Start Working" button that navigates to step detail

---

### Priority 8 — Mobile & Responsive Polish

**Problem**: Fixed 700px+ modules, complex grid doesn't adapt well.

**Solution**:
1. Stack all modules single-column on mobile (<768px)
2. Reduce hero stats to 2-column on tablet
3. Add swipe gestures for module categories on mobile
4. Make Quick Actions bar sticky on mobile

---

### Priority 9 — Typography & Spacing Refinements

**Problem**: Inconsistent spacing, some text is hard to read at small sizes.

**Solution**:
1. Increase base padding from `p-6` to `p-6 md:p-8` for primary modules
2. Standardize module header height (currently varies)
3. Increase label font-size from `text-[10px]` to `text-xs` for accessibility
4. Add consistent `gap-8` between module tiers

---

### Priority 10 — Subtle Animation Enhancements

**Problem**: Current animations (shimmer, glow-pulse) are generic.

**Solution**:
1. **Progress animations**: Ring fills animate on mount with staggered delay
2. **Achievement unlock**: Flash effect when new achievement unlocked since last visit
3. **Milestone proximity**: Pulsing border when <10% from next rank
4. **Reduce motion**: Respect `prefers-reduced-motion` and Profile settings

---

## Technical Implementation Outline

```
src/pages/Home.tsx Changes:
├── Add userState calculation (onboarding | active | advanced)
├── Create QuickActionsBar component
├── Create GettingStartedCard component
├── Merge GoalsGaugeModule + StepsGaugeModule → ProgressOverviewModule
├── Move Focus Goals rendering to top of module grid
├── Add insightMode props to action modules

src/components/home/ New Files:
├── QuickActionsBar.tsx
├── GettingStartedCard.tsx
├── ProgressOverviewModule.tsx
├── LockedModulesTeaser.tsx

src/hooks/useModuleLayout.ts Changes:
├── Add tier property to ModuleConfig (primary | secondary | tertiary)
├── Sort modules by tier then order
├── Hide individual locked modules when LockedModulesTeaser active

CSS/Styling:
├── Add .module-tier-primary, .module-tier-secondary classes
├── Mobile-first responsive adjustments
├── Accessibility font-size increases
```

---

## Deliverable Summary

| Improvement | Impact | Effort |
|-------------|--------|--------|
| Hero + Next Milestone redesign | High | Medium |
| User-state adaptive sections | High | Medium |
| Module consolidation | High | Medium |
| Quick Actions bar | Medium | Low |
| Module insights integration | Medium | Medium |
| Locked modules grouping | Medium | Low |
| Focus Goals enhancement | Medium | Low |
| Mobile/responsive polish | Medium | Medium |
| Typography refinements | Low | Low |
| Animation enhancements | Low | Low |

