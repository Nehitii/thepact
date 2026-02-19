
# Community Section -- Full Audit and Improvement Plan

## Critical Bugs Found

### BUG 1: Profiles are invisible to other users (BREAKING)
The `profiles` table RLS only allows `SELECT` where `auth.uid() = id`. This means when the community feed fetches profiles for other users' posts, **the query returns nothing**. Every post shows "Anonymous" with no avatar, even for discoverable users. This fundamentally breaks the social experience.

**Fix:** Add a new SELECT policy on `profiles` that exposes only safe community-facing columns (display_name, avatar_url, community_profile_discoverable) to all authenticated users.

### BUG 2: Goal info for other users' posts always fails (BREAKING)
The `goals` table RLS restricts SELECT to the goal owner only. When a post links to a goal, the community feed tries to fetch that goal's name/type -- but RLS blocks it since the viewer is not the goal owner. All "Linked to: [Goal]" badges silently show nothing.

**Fix:** Either denormalize the goal name into `community_posts` at creation time, or create a read-only view/function that returns minimal goal info for public posts.

### BUG 3: useCompletedGoals queries a non-existent column
`useCompletedGoals` does `.eq("user_id", user.id)` on the `goals` table, but goals has no `user_id` column -- it uses `pact_id` which links to `pacts.user_id`. This query returns zero results, making it impossible to link goals to posts or create Victory Reels.

**Fix:** Query through pacts: fetch user's pact first, then filter goals by `pact_id` and `status = 'fully_completed'`.

### BUG 4: Victory Reels video URLs are broken
The `victory-reels` storage bucket is **private** (not public), but `getPublicUrl()` is used to generate the URL. Private buckets require signed URLs via `createSignedUrl()`. All uploaded videos would return 403 errors.

**Fix:** Either make the bucket public, or switch to `createSignedUrl()` with expiry and regenerate URLs on fetch.

### BUG 5: View count increment is a race condition
`useIncrementReelView` does a SELECT then an UPDATE -- two separate queries. Under concurrent views, counts can be lost.

**Fix:** Use a single SQL `UPDATE victory_reels SET view_count = view_count + 1 WHERE id = $id` or an RPC function.

---

## Security Issues

### SEC 1: No content moderation or reporting
There is no mechanism to report abusive posts/replies, no admin moderation tools, and no content filtering. A single bad actor can post harmful content visible to all users.

**Fix:** Add a `community_reports` table with report reasons, and admin endpoints to review/delete flagged content. Add a "Report" button to post and reel cards.

### SEC 2: No rate limiting on posts/reactions
Users can spam unlimited posts and reactions. No server-side throttling exists.

**Fix:** Add a database trigger or RPC that limits posts per user per hour (e.g., max 5 posts/hour).

### SEC 3: Reply anonymization is inconsistent
Replies fetch `community_profile_discoverable` but don't check it -- the display name is shown regardless. The anonymization check that exists in `CommunityPostCard` for posts is not applied to replies.

**Fix:** Apply the same `isDiscoverable` logic to reply rendering.

---

## Backend Improvements

### BE 1: No pagination -- only first 50 posts loaded
Both posts and reels use `.limit(50)` with no cursor/offset pagination. As the community grows, older content becomes inaccessible and initial load grows heavy.

**Fix:** Implement cursor-based pagination using `created_at` as cursor, with "Load more" or infinite scroll.

### BE 2: N+1-like query pattern
The hook makes 5 parallel queries (posts, profiles, goals, reactions, replies, user_reactions) per load. While they're parallelized, this is 5 round trips. For a feed of 50 posts with 50 unique users, profiles alone could be a large `IN` clause.

**Fix:** Create a database function `get_community_feed(p_cursor, p_limit)` that returns posts with pre-joined profile and reaction data in a single query.

### BE 3: No realtime updates
The feed is purely polling-based with 30s stale time. New posts/reactions from other users don't appear until manual refresh.

**Fix:** Enable realtime on `community_posts` and `community_reactions` tables. Subscribe in the hook and optimistically update the query cache.

### BE 4: Denormalize reaction counts
Currently, every feed load re-counts all reactions by scanning the `community_reactions` table. This won't scale.

**Fix:** Add `support_count`, `respect_count`, `inspired_count` columns to `community_posts` (and `victory_reels`), updated via database triggers on reaction insert/delete.

---

## UI/UX Improvements

### UX 1: Community header is generic -- no engagement hooks
The header is a static icon + title. There's no sense of community size, activity, or personal engagement stats.

**Fix:** Add a compact stats bar showing: "X active members", "Y posts this week", "Your contributions: Z". This creates social proof and motivates participation.

### UX 2: No post filtering or search
Users can't filter by post type (reflections, obstacles, help requests) or search content. As posts accumulate, finding relevant content becomes impossible.

**Fix:** Add filter chips below the tabs for post types, and optionally a search bar.

### UX 3: Feed lacks visual hierarchy
All post types look identical except for a tiny badge. Help requests should feel urgent, progress posts should feel celebratory, obstacles should feel empathetic.

**Fix:** Give each post type a distinct left-border color and subtle background tint (e.g., amber for progress, red-ish for obstacles, blue for help requests).

### UX 4: No "trending" or "popular" sort option
Posts are purely chronological. High-quality posts with many reactions get buried under newer, less engaging content.

**Fix:** Add sort options: "Recent" (default), "Most Supported", "Trending" (reactions-per-hour weighted).

### UX 5: Reply UX is clunky
The reply textarea is always visible when replies are expanded, taking up space. There's no indication of who you're replying to, and no way to delete your own replies.

**Fix:** Show a compact "Reply..." input that expands on focus. Add delete button on own replies. Add a subtle "@name" mention feel.

### UX 6: Victory Reels empty state blocks creation
The CreateReel modal requires a completed goal, but `useCompletedGoals` is broken (Bug 3). Even if fixed, users with no completed goals see a confusing empty selector with no guidance.

**Fix:** After fixing Bug 3, add a clear CTA in the empty state: "Complete your first goal to unlock Victory Reels" with a link to the goals page.

### UX 7: No post editing capability
Users can't edit their posts after creation. Typos or clarifications require deleting and re-posting, losing all reactions and replies.

**Fix:** Add an edit button (visible only to post author) that opens the content in an inline editor, with an "edited" timestamp indicator.

### UX 8: CreatePostModal only allows linking completed goals
The `useCompletedGoals` hook only returns completed/validated goals. Users sharing "progress" or "obstacle" posts about active goals can't link them.

**Fix:** Offer both active and completed goals in the goal selector, with a visual distinction between them.

### UX 9: Victory Reels navigation is desktop-unfriendly
The vertical swipe container with touch events works for mobile but is awkward on desktop. Scroll hijacking (`preventDefault` on wheel) can trap users.

**Fix:** On desktop, use a card-based scrollable list or a horizontal carousel instead of full-screen swipe. Reserve the TikTok-style full-screen experience for mobile viewports only.

### UX 10: No user profile peek
Clicking on a post author's name/avatar does nothing. Users can't see who they're interacting with.

**Fix:** Add a hover card or click-through to a minimal public profile showing: display name, avatar, join date, number of posts, and achievements (if shared).

---

## Implementation Priority

### Phase 1 -- Fix Critical Bugs (must-do)
1. Fix profiles RLS (add public SELECT for community columns)
2. Fix useCompletedGoals query (pact_id join)
3. Fix Victory Reels video URLs (signed URLs or public bucket)
4. Fix view count race condition (atomic update)
5. Denormalize goal name into community_posts

### Phase 2 -- Security and Data Integrity
6. Fix reply anonymization
7. Add community_reports table + report button
8. Add post rate limiting trigger
9. Denormalize reaction counts with triggers

### Phase 3 -- Core UX Upgrades
10. Post type visual differentiation (colored borders)
11. Post filtering by type
12. Sort options (Recent / Popular)
13. Fix goal linking to include active goals
14. Reply UX improvements (compact input, delete own)

### Phase 4 -- Engagement Features
15. Community stats bar in header
16. Cursor-based pagination with infinite scroll
17. Realtime subscriptions for live updates
18. Post editing
19. User profile hover card

### Phase 5 -- Victory Reels Polish
20. Desktop-friendly reels layout
21. Better empty state with goal completion CTA
22. Server-side feed function for performance

---

## Technical Details

### Database Changes
- **profiles RLS**: New SELECT policy for authenticated users on safe columns
- **New table**: `community_reports` (id, reporter_id, post_id, reel_id, reply_id, reason, status, created_at)
- **New columns on community_posts**: `goal_name TEXT` (denormalized), `support_count INT DEFAULT 0`, `respect_count INT DEFAULT 0`, `inspired_count INT DEFAULT 0`
- **New trigger**: On `community_reactions` INSERT/DELETE, increment/decrement the count columns
- **New RPC**: `increment_reel_view(p_reel_id uuid)` for atomic view count
- **New RPC**: `get_community_feed(p_cursor timestamptz, p_limit int)` for optimized feed query
- **Enable realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE community_posts, community_reactions`

### Files Modified
| File | Changes |
|---|---|
| `src/hooks/useCommunity.ts` | Fix useCompletedGoals, add pagination, fix video URLs, add realtime |
| `src/components/community/CommunityFeed.tsx` | Filter chips, sort toggle, infinite scroll, stats bar |
| `src/components/community/CommunityPostCard.tsx` | Post type colors, edit button, report button, reply fixes |
| `src/components/community/VictoryReelsFeed.tsx` | Desktop layout, pagination |
| `src/components/community/VictoryReelCard.tsx` | Signed video URLs |
| `src/components/community/CreatePostModal.tsx` | Active + completed goals |
| `src/components/community/CreateReelModal.tsx` | Signed upload URLs |
| `src/components/community/ReactionButton.tsx` | Minor polish |
| `src/pages/Community.tsx` | Stats bar, filter state |

### New Files
| File | Purpose |
|---|---|
| `src/components/community/PostFilters.tsx` | Filter chips + sort selector |
| `src/components/community/ReportModal.tsx` | Content reporting dialog |
| `src/components/community/UserProfileCard.tsx` | Hover card for author info |

### Storage
- Consider making `victory-reels` bucket public, or implement signed URL generation with 1-hour expiry in the feed hook
