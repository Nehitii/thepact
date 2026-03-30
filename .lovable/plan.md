

# Calendar — Auto-Connect Todos/Goals/Steps Deadlines + Improvements

## Current State

The calendar displays only manually created `calendar_events`. Todos with deadlines, goals with deadlines, and steps with due_dates exist in separate tables but are invisible on the calendar. The `calendar_events` table already has `linked_goal_id` and `linked_todo_id` columns, but nothing populates them automatically.

## Plan

### Feature 1: Aggregate External Deadlines as Virtual Calendar Events

**Approach**: Instead of duplicating data into `calendar_events`, fetch deadlines from `todo_tasks`, `goals`, and `steps` directly in `useCalendarEvents` and merge them as virtual (read-only) calendar events with a special `_source` field.

**`src/hooks/useCalendarEvents.ts`**:
- Add 3 parallel `useQuery` calls:
  - `todo_tasks` where `deadline IS NOT NULL AND status = 'active'` — render as all-day events with category `"todo"`, orange color
  - `goals` (via pacts join) where `deadline IS NOT NULL AND status NOT IN ('completed','archived')` — render as all-day events with category `"goal-deadline"`, purple color
  - `steps` (via goals→pacts join) where `due_date IS NOT NULL AND status != 'completed'` — render as all-day events with category `"step-due"`, teal color
- Each external item gets mapped to a virtual `CalendarEvent` with `_virtual: true`, `_source: 'todo'|'goal'|'step'`, non-editable from calendar
- Extend `CalendarEvent` type with `_source?: string`
- Merge into the `events` memo alongside real calendar events

**`src/components/calendar/EventCard.tsx`**:
- Show a small icon badge based on `_source` (CheckSquare for todo, Target for goal, Footprints for step)
- Different visual style for external items (dashed border instead of solid)

**`src/components/calendar/CalendarPage.tsx`**:
- Add a filter toggle in the toolbar area to show/hide external items (todos, goals, steps) — default ON
- When clicking an external event, show a read-only info card with a "Go to" link instead of the edit modal

### Feature 2: Source Filter Chips

**`src/components/calendar/CalendarToolbar.tsx`**:
- Add filter chips below the toolbar: "Events", "Todos", "Goals", "Steps" — each toggleable
- Pass active filters down to CalendarPage which filters the merged events array

### Feature 3: Calendar Improvements

**A. Mini sidebar with upcoming deadlines** (`src/components/calendar/CalendarSidebar.tsx`):
- Small panel on desktop showing next 5 upcoming deadlines across all sources
- Click navigates to the day view

**B. Week number display** in MonthView:
- Show ISO week numbers in the left gutter of each row

**C. Today indicator improvement**:
- Add a pulsing dot on today's date in month view
- Current time indicator line in day/week views (red line at current hour)

**D. Event count badge on day cells** in YearView:
- Show a colored dot per source type (orange=todo, purple=goal, blue=event)

**E. Keyboard navigation**:
- Arrow keys to move between days in month view
- Enter to open quick-add on selected day
- Escape to close modals (already works)

**F. Drag & drop in Week/Day views**:
- Allow vertical drag to change event time (not just day)
- Only for real calendar events, not virtual ones

**G. "Go to date" picker**:
- Add a date picker popover on the title in the toolbar to jump to any date

**H. Event duration visual in week/day views**:
- Show events spanning their actual time slot height (currently just listed)

**I. Toolbar i18n**:
- Replace single-letter view labels (D/W/M/Y/A) with translated short labels

---

## Files Impact

| Action | File |
|--------|------|
| **Edit** | `src/hooks/useCalendarEvents.ts` — add todo/goal/step queries, merge virtual events, extend types |
| **Edit** | `src/components/calendar/CalendarPage.tsx` — add source filters state, pass to views, handle external event clicks |
| **Edit** | `src/components/calendar/CalendarToolbar.tsx` — add filter chips, go-to-date picker, i18n labels |
| **Edit** | `src/components/calendar/EventCard.tsx` — source icon badges, dashed border for virtual |
| **Edit** | `src/components/calendar/views/MonthView.tsx` — week numbers, keyboard nav, today dot |
| **Edit** | `src/components/calendar/views/WeekView.tsx` — current time line, proportional event height |
| **Edit** | `src/components/calendar/views/DayView.tsx` — current time line, proportional event height |
| **Edit** | `src/components/calendar/views/YearView.tsx` — multi-source colored dots |
| **Edit** | `src/components/calendar/views/AgendaView.tsx` — source badges |
| **New** | `src/components/calendar/CalendarSidebar.tsx` — upcoming deadlines mini panel |
| **New** | `src/components/calendar/SourceFilterChips.tsx` — filter toggle chips component |
| **Edit** | `src/i18n/locales/en.json` — new calendar.* keys |
| **Edit** | `src/i18n/locales/fr.json` — new calendar.* keys |

No database changes needed — all data is read from existing tables.

