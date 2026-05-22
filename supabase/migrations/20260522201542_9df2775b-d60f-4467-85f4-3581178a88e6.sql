INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('social.friends', false, 'Friends module: friend list, requests, presence'),
  ('social.guilds', false, 'Guilds module: collective MMO chambers'),
  ('social.community', false, 'Community feed and victory reels'),
  ('social.leaderboard', false, 'Public leaderboard'),
  ('social.hall_of_fame', false, 'Hall of fame'),
  ('social.inbox', false, 'Private messaging inbox'),
  ('social.sharing', false, 'Sharing of goals/pacts with other users'),
  ('social.templates_marketplace', false, 'Public templates marketplace'),
  ('social.victory_reels', false, 'Victory reels public feed')
ON CONFLICT (key) DO NOTHING;