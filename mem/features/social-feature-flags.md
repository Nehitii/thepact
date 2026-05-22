---
name: Social Feature Flags
description: All social features are flag-gated via useSocialFeatures hook; disabled by default
type: feature
---
Flags (table `feature_flags`, all default `enabled=false`):
- social.friends, social.guilds, social.community, social.leaderboard, social.hall_of_fame
- social.inbox, social.sharing, social.templates_marketplace, social.victory_reels

Use `useSocialFeatures()` (src/hooks/useSocialFeatures.ts) in any UI/route gating.
Gating points already in place:
- src/App.tsx — `SocialGate` wraps `/community`, `/friends`, `/leaderboard`, `/hall-of-fame`, `/inbox`, `/inbox/thread/:userId`, `/guild/:id`, `/templates/marketplace`
- src/components/layout/AppSidebar.tsx — network section filtered, hidden when empty; inbox dropdown gated
- src/components/layout/MobileBottomNav.tsx — Friends/Inbox tabs filtered
- src/pages/GoalDetail.tsx — "Share with Friend" button gated on `social.sharing`
- src/components/notifications/NotificationHub.tsx — "social" category notifications and Messages tab filtered when `!social.anySocial` / `!social.inbox`

To reactivate: `UPDATE feature_flags SET enabled=true WHERE key='social.xxx';`
Code is fully intact — only UI/routing is conditioned.