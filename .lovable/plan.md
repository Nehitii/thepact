

# Sidebar Reorganization Plan

## Current State: 3 sections, up to 23 items

| Section | Items | Count |
|---------|-------|-------|
| **Main_Interface** | Home, Goals, Focus, Analytics, Achievements, Leaderboard, Friends, Inbox, Shop, Community | 10 |
| **Active_Modules** | To-Do, Journal, Finance, The Call, Health, Wishlist | 0-6 |
| **User_Settings** | Account, Bounded, Pact, Display, Notifs, Privacy, Data | 7 |

**Problems identified:**
- Main_Interface mixes core productivity (Goals, Focus) with social (Friends, Community, Leaderboard) and utility (Shop, Inbox)
- Active_Modules is a separate section for items that are functionally identical to main nav links
- User_Settings takes 7 lines of sidebar for pages that are visited rarely — these should not compete for space with daily-use navigation
- Achievements and Leaderboard are gamification features sitting alongside core tools

---

## Proposed Structure: 2 sections + footer

```text
┌─────────────────────┐
│  THE PACT            │
├─────────────────────┤
│  COMMAND_CENTER      │  ← Core daily tools
│  · Home              │
│  · Goals             │
│  · To-Do List    ⬡   │  ← Modules merged here
│  · Focus             │
│  · Journal       ⬡   │
│  · Finance       ⬡   │
│  · Health        ⬡   │
│  · Wishlist      ⬡   │
│  · Analytics         │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  NETWORK             │  ← Social & gamification
│  · Community         │
│  · Friends       (3) │
│  · Inbox         (2) │
│  · Leaderboard       │
│  · Achievements      │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  · Shop              │  ← Standalone, always visible
│  · The Call      ⬡   │
├─────────────────────┤
│  [Avatar] Agent      │  ← Footer dropdown
│   → Profile/Settings │     contains ALL 7 settings
│   → Switch Pact      │     pages + sign out
│   → Disconnect       │
└─────────────────────┘
```

⬡ = only shown if module is purchased (same logic as today)

### Key changes

1. **Merge Active_Modules into the main list** — purchased modules appear inline at logical positions (To-Do after Goals, Journal after Focus, etc.) instead of a separate collapsible group. Unpurchased modules simply don't appear. This eliminates the visual break and treats modules as first-class navigation.

2. **Regroup into "Command_Center" + "Network"** — Separates daily productivity tools from social/gamification features. This makes the sidebar scannable by intent.

3. **Remove User_Settings from sidebar nav entirely** — All 7 settings pages move into the footer avatar dropdown menu (which already has Profile, Notifications, etc.). Settings are low-frequency pages; they don't deserve prime sidebar real estate. The dropdown becomes the single entry point for all settings.

4. **Shop + The Call as standalone items** — Shop is utility (not daily productivity), The Call is a special event-type module. They sit below the two main groups.

5. **"Explore Modules" CTA** — When no modules are purchased, a subtle CTA appears at the bottom of Command_Center (same as today but repositioned).

### Footer dropdown (expanded)

```text
Quick Actions
─────────────
  Profile & Account
  Pact Settings
  Display & Sound
  Notifications
  Privacy
  Data & Export
─────────────
  Switch Pact
─────────────
  Disconnect
```

"Bounded Profile" merges into "Profile & Account" as a tab/section — it doesn't need its own top-level settings entry.

### Mini mode behavior

- **Command_Center** + **Network**: Icons remain visible as today
- **Shop / The Call**: Icons visible
- **Settings**: Footer avatar dropdown (unchanged)
- No more popover for settings section since it's in the dropdown

### Files modified

| File | Change |
|------|--------|
| `src/components/layout/AppSidebar.tsx` | Restructure nav config, merge modules inline, remove settings section, expand footer dropdown with all settings links |

No database changes. No new files needed.

