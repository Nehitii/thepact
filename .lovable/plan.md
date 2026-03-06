

# THE PACT -- Full Site Audit & Enhancement Roadmap

---

## Current Feature Map

| Section | Status | Maturity |
|---------|--------|----------|
| Auth (2FA, deep space canvas) | Solid | High |
| Onboarding | Functional but basic | Medium |
| Home Dashboard | Feature-rich (rank, countdown, missions, difficulty scale) | High |
| Goals (standard, super, habit) | Recently overhauled | High |
| Finance (Dashboard/Budget/Planner) | Recently overhauled | High |
| Shop (cosmetics, modules, bonds, bundles, daily deals) | Complete | High |
| Community (feed, reels, reactions, reports) | Functional | Medium |
| Health (check-in, BMI, challenges, breathing, insights) | Feature-rich | High |
| Todo List (gamified, drag-drop, focus mode) | Solid | High |
| Journal (rich editor, moods, infinite scroll) | Solid | Medium |
| Wishlist (duplicate merge, goal sync) | Functional | Medium |
| Inbox (notifications + messages) | Functional | Low |
| Achievements (Hall of Eternity) | Display-only | Medium |
| The Call (daily check-in ritual) | Unique mechanic | High |
| Profile/Settings (6 sub-pages) | Complete | High |
| Admin (cosmetics, modules, money, promos, notifications) | Complete | High |

---

## Enhancement Proposals (by impact)

### 1. AI-Powered Personal Coach
Use Lovable AI (Gemini/GPT) to generate personalized insights across modules. An edge function analyzes the user's goals progress, health trends, finance patterns, and journal mood history, then surfaces a weekly digest or on-demand coaching card on the Home dashboard.

**What it adds**: Cross-module intelligence. The app currently has rich data silos (goals, health, finance, journal) but no system that connects them into actionable advice.

**Scope**: New edge function + new Home widget + new "AI Coach" panel accessible from sidebar.

---

### 2. Streak & Habit Engine Overhaul
Currently, habits are a `goal_type === "habit"` with a boolean array (`habit_checks`). This is limiting -- no streak tracking, no streak recovery, no visual calendar heatmap, no habit categories.

**Proposed**:
- Dedicated `/habits` page (or tab inside Goals) with a GitHub-style contribution heatmap
- Streak multipliers that feed into Bond rewards
- "Don't break the chain" visual with grace days (configurable)
- Habit templates (exercise, reading, meditation, coding)

**Scope**: New page + new DB table `habit_logs` + heatmap component + Bond reward trigger.

---

### 3. Inbox Messaging System (Completion)
The Inbox messages tab has placeholder navigation (`console.log("Navigate to thread")`) and hardcoded timestamps ("2h ago"). The messaging system is incomplete.

**Proposed**:
- Thread view (`/inbox/thread/:userId`) with real-time chat using Supabase Realtime
- Actual timestamp formatting using `date-fns`
- Message composition with text input
- Read receipts (already have `is_read` field)
- Typing indicators via Realtime presence

**Scope**: New ThreadView page + Realtime subscription + complete the existing `useMessages` hook.

---

### 4. Leaderboard & Social Profiles
The Community section has posts and reels but no competitive/social discovery layer. Users can't visit each other's profiles or see rankings.

**Proposed**:
- Public profile page (`/user/:id`) showing display name, avatar, frame, title, rank, achievement count, and completed goals count
- Global leaderboard (by XP/rank, weekly activity, streaks)
- "Follow" system to see specific users' posts in a personalized feed
- Weekly spotlight: auto-feature the top contributor

**Scope**: New pages + new `follows` table + leaderboard edge function + public profile components.

---

### 5. Goal Templates & Import
Users currently create goals from scratch every time. Templates would let them start from curated or community-shared blueprints.

**Proposed**:
- Template library on the NewGoal page (e.g., "Learn a Language", "Run a Marathon", "Launch a Business")
- Each template pre-fills steps, difficulty, tags, and estimated cost
- Users can share their completed goals as templates to the community
- Admin panel to curate featured templates

**Scope**: New `goal_templates` table + template browser UI + share-to-template flow.

---

### 6. Daily Focus / Pomodoro Timer
The Todo module has a "Focus Overlay" but no actual timer or productivity technique integration.

**Proposed**:
- Pomodoro timer (25/5 or custom intervals) that links to a specific task or goal step
- Session history with productivity stats (sessions completed, total focus time)
- Bond rewards for completing focus sessions
- Ambient sound integration (already have sound system)

**Scope**: New `focus_sessions` table + Timer component + integration with Todo and Goals.

---

### 7. Weekly Review / Retrospective
No mechanism exists for users to reflect on their week holistically.

**Proposed**:
- Weekly prompt (triggered Sunday evening or configurable) that auto-generates a summary: goals progressed, health score trend, finance snapshot, journal entries count, todo completion rate
- User adds a reflection note and rates their week
- Historical timeline of weekly reviews
- AI-generated insights comparing this week vs last

**Scope**: New `weekly_reviews` table + edge function for auto-summary + new page or modal.

---

### 8. Notification Automation & Smart Reminders
The notification system exists but only supports manual admin-sent notifications. No automated triggers.

**Proposed**:
- Goal deadline approaching (3 days, 1 day, overdue) -- auto-notification
- Health check-in reminder if not done today
- Finance validation reminder at month-end
- Streak at risk warning (The Call not completed today by 9pm)
- Todo tasks due today morning digest

**Scope**: Scheduled edge function (cron) + notification creation logic + user preference toggles (already have `notification_settings` table).

---

### 9. Data Visualization Dashboard
The Home page has monitoring panels but no unified analytics view showing long-term trends.

**Proposed**:
- `/analytics` page with:
  - Goal completion velocity chart (goals completed per month)
  - Health score trend (30/90/365 day)
  - Finance net balance evolution
  - Journal writing frequency
  - Mood distribution over time
  - Achievement unlock timeline
- Exportable as PDF report

**Scope**: New page + Recharts compositions + data aggregation queries.

---

### 10. Onboarding Overhaul
Current onboarding is 3 static intro screens + a form. For a gamified app of this depth, it's underwhelming.

**Proposed**:
- Interactive tutorial that walks through creating first goal, doing first check-in, and visiting the shop
- Progress checklist that persists until all steps are done
- Reward first-time users with starter Bonds
- Animated cinematic intro matching the cyberpunk aesthetic

**Scope**: Refactor `Onboarding.tsx` + new `onboarding_progress` tracking + Bond reward trigger.

---

## Quick Wins (Low effort, high polish)

| Enhancement | Effort | Impact |
|------------|--------|--------|
| Fix Inbox message timestamps (replace "2h ago" with real `formatDistanceToNow`) | 10 min | Bug fix |
| Fix Inbox thread navigation (replace `console.log` with actual route) | 15 min | Bug fix |
| Add keyboard shortcuts (G then G = Goals, G then H = Home, etc.) | 1 hour | Power users |
| Add dark/light theme toggle to sidebar (system exists but no quick toggle) | 30 min | UX |
| Add search across all sections (global command palette with cmdk, already installed) | 2 hours | UX |
| Add "What's New" changelog modal | 1 hour | Engagement |

---

## Recommended Priority Order

1. **Inbox bug fixes** (timestamps + thread nav) -- broken features
2. **Notification automation** -- retention driver
3. **AI Coach** -- differentiator, leverages existing data
4. **Streak/Habit overhaul** -- core engagement loop
5. **Weekly Review** -- reflection + retention
6. **Goal Templates** -- reduces friction
7. **Leaderboard + Social Profiles** -- community growth
8. **Pomodoro Timer** -- productivity depth
9. **Analytics Dashboard** -- data visualization
10. **Onboarding Overhaul** -- first impression

