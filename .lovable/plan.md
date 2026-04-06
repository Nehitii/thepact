

# Achievements Deep Expansion — Plan

## Current State
- 31 achievements in DB across 8 categories (Connection, GoalsCreation, Difficulty, Time, Pact, Finance, Hidden, Series, health)
- Categories covered: login streaks, goal creation/completion, pact, health, time-based, hidden
- **Not covered**: Todos, Finance, Calendar, Community, Friends/Guilds, Focus/Pomodoro, Journal, Wishlist, Shop/Modules, Cosmetics
- No category filter in the UI (only rarity + locked/unlocked)
- No "module-gated" achievements (achievements requiring a purchased module)
- Achievement tracking table only has fields for logins, goals, steps, pact, finance, health — missing counters for todos, friends, guilds, journal, focus, community, wishlist, shop

## Plan

### 1. Database Migration — Expand tracking + seed ~70 new achievements

**Expand `achievement_tracking` columns** to track:
- `todos_completed`, `todos_created`, `pomodoro_sessions`, `pomodoro_total_minutes`
- `journal_entries`, `friends_count`, `guilds_joined`, `guild_messages_sent`
- `community_posts`, `wishlist_items_added`, `wishlist_items_acquired`
- `modules_purchased`, `cosmetics_owned`, `calendar_events_created`
- `bonds_spent_total`, `bonds_earned_total`
- `finance_months_validated`, `transactions_logged`

**Seed ~70 new `achievement_definitions`** across new categories:

| Category | Examples | Count |
|----------|---------|-------|
| **Todo** | Complete 1/10/50/100/500 todos, create a recurring todo | ~6 |
| **Focus** | 1st pomodoro, 10/50/100 sessions, 1000 min total, 5 sessions in a day | ~6 |
| **Journal** | 1st entry, 7/30/100 entries, write 3 days in a row | ~5 |
| **Social** | Add 1st friend, 5/10/25 friends, join a guild, send 100 guild messages, create a guild | ~7 |
| **Community** | 1st post, 10 posts, get 50 reactions, 1st victory reel | ~5 |
| **Finance** | Log 1st transaction, validate 1/3/6/12 months, positive balance 3 months in a row | ~6 |
| **Wishlist** | Add 1st item, acquire 5/10 items, complete full wishlist | ~4 |
| **Calendar** | Create 1st event, 10/50 events, RSVP to a guild event | ~4 |
| **Shop** | Buy 1st module, own all modules, buy 1st cosmetic, spend 1000/5000/10000 bonds | ~6 |
| **Module-Gated** | Achievements requiring a specific module to be purchased (e.g. "Health Devotee" requires Track Health module + 30 checkins) | ~8 |
| **Hidden (new)** | Complete a goal at exactly midnight, have 0 todos for a full day, buy something from every shop category | ~5 |
| **Legendary/Mythic** | 100% all modules purchased, 365-day login streak, complete 10 impossible goals | ~5 |

Total: ~70 new achievements → ~100 total

**Add `required_module` column** to `achievement_definitions` (nullable text, references shop_modules.key). When set, the achievement only appears/can be unlocked if the user owns that module.

### 2. Expand `checkAchievements` logic in `achievements.ts`

Add condition handlers for all new types:
- `todos_completed`, `pomodoro_sessions`, `journal_entries`, `friends_count`, etc.
- `module_gated` type: check `user_module_purchases` before allowing unlock
- `bonds_spent_total`, `modules_purchased`, `cosmetics_owned`

Add new tracking functions:
- `trackTodoCompleted`, `trackPomodoroCompleted`, `trackJournalEntry`, `trackFriendAdded`, `trackModulePurchased`, `trackCosmeticPurchased`, `trackCalendarEventCreated`, `trackWishlistItemAdded`, `trackWishlistItemAcquired`, `trackCommunityPost`, `trackGuildMessageSent`

### 3. Wire tracking calls into existing hooks

Inject tracking calls at the right places:
- `useTodoList.ts` → `trackTodoCompleted` on task completion
- `usePomodoro.ts` → `trackPomodoroCompleted` on session end
- `useJournal.ts` → `trackJournalEntry` on new entry
- `useFriends.ts` → `trackFriendAdded` on accept
- `useShopTransaction.ts` → `trackModulePurchased` / `trackCosmeticPurchased`
- `useCalendarEvents.ts` → `trackCalendarEventCreated`
- `useWishlist.ts` → `trackWishlistItemAdded` / `trackWishlistItemAcquired`
- `useCommunity.ts` → `trackCommunityPost`
- `useGuilds.ts` → `trackGuildMessageSent`

### 4. UI — Add category filter to `/achievements`

- Add a **category filter** (horizontal scrollable chips or tabs) alongside the existing rarity dropdown
- Categories: All, Connection, Goals, Difficulty, Time, Pact, Todo, Focus, Journal, Social, Finance, Wishlist, Calendar, Shop, Hidden
- Module-gated achievements show a lock icon with the module name when the user doesn't own the required module
- Add category grouping option (toggle between flat grid and grouped-by-category sections)

### 5. Achievement card enhancements

- Show module requirement badge on module-gated achievements (e.g. "Requires: Track Health")
- Add Bond reward display on each card (achievements grant bonds on unlock)
- Achievement points system: each achievement has a point value based on rarity (common=25, uncommon=50, rare=100, epic=250, mythic=500, legendary=1000)

### 6. Migration — Add `bond_reward` and `points` to achievement_definitions

- `bond_reward` integer default 0 — bonds granted on unlock
- `points` integer default 0 — score points for the leaderboard
- Update `grant_achievement` RPC to also credit bonds

## Files Impacted

| Action | File |
|--------|------|
| **Migration** | New columns on `achievement_tracking`, `achievement_definitions` + seed ~70 achievements |
| **Edit** | `src/lib/achievements.ts` — new tracking functions, expanded checkAchievements |
| **Edit** | `src/pages/Achievements.tsx` — category filter, grouped view, points display |
| **Edit** | `src/components/achievements/AchievementCard.tsx` — module badge, bond reward, points |
| **Edit** | `src/hooks/useTodoList.ts` — wire trackTodoCompleted |
| **Edit** | `src/hooks/usePomodoro.ts` — wire trackPomodoroCompleted |
| **Edit** | `src/hooks/useJournal.ts` — wire trackJournalEntry |
| **Edit** | `src/hooks/useFriends.ts` — wire trackFriendAdded |
| **Edit** | `src/hooks/useShopTransaction.ts` — wire trackModulePurchased |
| **Edit** | `src/hooks/useCalendarEvents.ts` — wire trackCalendarEventCreated |
| **Edit** | `src/hooks/useWishlist.ts` — wire trackWishlistItemAdded |
| **Edit** | `src/hooks/useCommunity.ts` — wire trackCommunityPost |
| **Edit** | `src/i18n/locales/en.json`, `fr.json` — achievement category labels |

