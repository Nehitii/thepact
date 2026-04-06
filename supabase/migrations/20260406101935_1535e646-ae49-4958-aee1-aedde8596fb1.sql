
-- 1. Expand achievement_tracking columns
ALTER TABLE public.achievement_tracking
  ADD COLUMN IF NOT EXISTS todos_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS todos_created integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pomodoro_sessions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pomodoro_total_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS journal_entries integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS friends_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guilds_joined integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guild_messages_sent integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS community_posts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wishlist_items_added integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wishlist_items_acquired integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS modules_purchased integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cosmetics_owned integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calendar_events_created integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonds_spent_total integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonds_earned_total integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS finance_months_validated integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transactions_logged integer DEFAULT 0;

-- 2. Expand achievement_definitions
ALTER TABLE public.achievement_definitions
  ADD COLUMN IF NOT EXISTS required_module text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bond_reward integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;

-- 3. Update increment_tracking_counter to support new fields
CREATE OR REPLACE FUNCTION public.increment_tracking_counter(p_user_id uuid, p_field text, p_increment integer DEFAULT 1)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM achievement_tracking WHERE user_id = p_user_id) THEN
    INSERT INTO achievement_tracking (user_id) VALUES (p_user_id);
  END IF;

  CASE p_field
    WHEN 'total_goals_created' THEN UPDATE achievement_tracking SET total_goals_created = COALESCE(total_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'easy_goals_created' THEN UPDATE achievement_tracking SET easy_goals_created = COALESCE(easy_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'medium_goals_created' THEN UPDATE achievement_tracking SET medium_goals_created = COALESCE(medium_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'hard_goals_created' THEN UPDATE achievement_tracking SET hard_goals_created = COALESCE(hard_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'extreme_goals_created' THEN UPDATE achievement_tracking SET extreme_goals_created = COALESCE(extreme_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'impossible_goals_created' THEN UPDATE achievement_tracking SET impossible_goals_created = COALESCE(impossible_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'custom_goals_created' THEN UPDATE achievement_tracking SET custom_goals_created = COALESCE(custom_goals_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'goals_completed_total' THEN UPDATE achievement_tracking SET goals_completed_total = COALESCE(goals_completed_total, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'easy_goals_completed' THEN UPDATE achievement_tracking SET easy_goals_completed = COALESCE(easy_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'medium_goals_completed' THEN UPDATE achievement_tracking SET medium_goals_completed = COALESCE(medium_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'hard_goals_completed' THEN UPDATE achievement_tracking SET hard_goals_completed = COALESCE(hard_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'extreme_goals_completed' THEN UPDATE achievement_tracking SET extreme_goals_completed = COALESCE(extreme_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'impossible_goals_completed' THEN UPDATE achievement_tracking SET impossible_goals_completed = COALESCE(impossible_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'custom_goals_completed' THEN UPDATE achievement_tracking SET custom_goals_completed = COALESCE(custom_goals_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'steps_completed_total' THEN UPDATE achievement_tracking SET steps_completed_total = COALESCE(steps_completed_total, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'todos_completed' THEN UPDATE achievement_tracking SET todos_completed = COALESCE(todos_completed, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'todos_created' THEN UPDATE achievement_tracking SET todos_created = COALESCE(todos_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'pomodoro_sessions' THEN UPDATE achievement_tracking SET pomodoro_sessions = COALESCE(pomodoro_sessions, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'pomodoro_total_minutes' THEN UPDATE achievement_tracking SET pomodoro_total_minutes = COALESCE(pomodoro_total_minutes, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'journal_entries' THEN UPDATE achievement_tracking SET journal_entries = COALESCE(journal_entries, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'friends_count' THEN UPDATE achievement_tracking SET friends_count = COALESCE(friends_count, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'guilds_joined' THEN UPDATE achievement_tracking SET guilds_joined = COALESCE(guilds_joined, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'guild_messages_sent' THEN UPDATE achievement_tracking SET guild_messages_sent = COALESCE(guild_messages_sent, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'community_posts' THEN UPDATE achievement_tracking SET community_posts = COALESCE(community_posts, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'wishlist_items_added' THEN UPDATE achievement_tracking SET wishlist_items_added = COALESCE(wishlist_items_added, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'wishlist_items_acquired' THEN UPDATE achievement_tracking SET wishlist_items_acquired = COALESCE(wishlist_items_acquired, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'modules_purchased' THEN UPDATE achievement_tracking SET modules_purchased = COALESCE(modules_purchased, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'cosmetics_owned' THEN UPDATE achievement_tracking SET cosmetics_owned = COALESCE(cosmetics_owned, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'calendar_events_created' THEN UPDATE achievement_tracking SET calendar_events_created = COALESCE(calendar_events_created, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'bonds_spent_total' THEN UPDATE achievement_tracking SET bonds_spent_total = COALESCE(bonds_spent_total, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'bonds_earned_total' THEN UPDATE achievement_tracking SET bonds_earned_total = COALESCE(bonds_earned_total, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'finance_months_validated' THEN UPDATE achievement_tracking SET finance_months_validated = COALESCE(finance_months_validated, 0) + p_increment WHERE user_id = p_user_id;
    WHEN 'transactions_logged' THEN UPDATE achievement_tracking SET transactions_logged = COALESCE(transactions_logged, 0) + p_increment WHERE user_id = p_user_id;
    ELSE NULL;
  END CASE;
END;
$$;

-- 4. Update grant_achievement to credit bond rewards
CREATE OR REPLACE FUNCTION public.grant_achievement(p_achievement_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_reward integer;
  v_already boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM achievement_definitions WHERE key = p_achievement_key) THEN
    RETURN false;
  END IF;

  -- Check if already unlocked
  SELECT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = v_user_id AND achievement_key = p_achievement_key) INTO v_already;
  IF v_already THEN
    RETURN false;
  END IF;

  INSERT INTO user_achievements (user_id, achievement_key, seen)
  VALUES (v_user_id, p_achievement_key, false)
  ON CONFLICT DO NOTHING;

  -- Credit bond reward if any
  SELECT bond_reward INTO v_reward FROM achievement_definitions WHERE key = p_achievement_key;
  IF v_reward IS NOT NULL AND v_reward > 0 THEN
    UPDATE bond_balance
    SET balance = balance + v_reward,
        total_earned = total_earned + v_reward,
        updated_at = now()
    WHERE user_id = v_user_id;

    IF FOUND THEN
      INSERT INTO bond_transactions (user_id, amount, transaction_type, description, reference_type)
      VALUES (v_user_id, v_reward, 'achievement', 'Achievement: ' || p_achievement_key, 'achievement');
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- 5. Seed new achievements (~70 new)
INSERT INTO public.achievement_definitions (key, name, description, category, rarity, icon_key, conditions, is_hidden, bond_reward, points) VALUES
-- Todo category
('todo_first_task', 'First Steps', 'Complete your first to-do task', 'Todo', 'common', 'check-circle', '{"type":"todos_completed","value":1}', false, 5, 25),
('todo_10_tasks', 'Getting Things Done', 'Complete 10 to-do tasks', 'Todo', 'common', 'list-checks', '{"type":"todos_completed","value":10}', false, 15, 25),
('todo_50_tasks', 'Task Crusher', 'Complete 50 to-do tasks', 'Todo', 'uncommon', 'list-todo', '{"type":"todos_completed","value":50}', false, 30, 50),
('todo_100_tasks', 'Centurion', 'Complete 100 to-do tasks', 'Todo', 'rare', 'shield-check', '{"type":"todos_completed","value":100}', false, 75, 100),
('todo_500_tasks', 'Machine Mode', 'Complete 500 to-do tasks', 'Todo', 'epic', 'cpu', '{"type":"todos_completed","value":500}', false, 200, 250),
('todo_1000_tasks', 'Unstoppable Force', 'Complete 1000 to-do tasks', 'Todo', 'legendary', 'zap', '{"type":"todos_completed","value":1000}', false, 500, 1000),

-- Focus/Pomodoro category
('focus_first_session', 'First Focus', 'Complete your first pomodoro session', 'Focus', 'common', 'timer', '{"type":"pomodoro_sessions","value":1}', false, 5, 25),
('focus_10_sessions', 'Deep Worker', 'Complete 10 pomodoro sessions', 'Focus', 'common', 'brain', '{"type":"pomodoro_sessions","value":10}', false, 15, 25),
('focus_50_sessions', 'Flow State Master', 'Complete 50 pomodoro sessions', 'Focus', 'uncommon', 'flame', '{"type":"pomodoro_sessions","value":50}', false, 40, 50),
('focus_100_sessions', 'Hyperfocus', 'Complete 100 pomodoro sessions', 'Focus', 'rare', 'activity', '{"type":"pomodoro_sessions","value":100}', false, 100, 100),
('focus_500_sessions', 'Time Bender', 'Complete 500 pomodoro sessions', 'Focus', 'epic', 'clock', '{"type":"pomodoro_sessions","value":500}', false, 250, 250),
('focus_1000_min', 'Marathon Mind', 'Accumulate 1000 minutes of focus', 'Focus', 'rare', 'hourglass', '{"type":"pomodoro_total_minutes","value":1000}', false, 100, 100),
('focus_5000_min', 'Transcendence', 'Accumulate 5000 minutes of focus', 'Focus', 'legendary', 'sparkles', '{"type":"pomodoro_total_minutes","value":5000}', false, 500, 1000),

-- Journal category
('journal_first_entry', 'Dear Diary', 'Write your first journal entry', 'Journal', 'common', 'book-open', '{"type":"journal_entries","value":1}', false, 5, 25),
('journal_7_entries', 'Weekly Reflect', 'Write 7 journal entries', 'Journal', 'common', 'notebook-pen', '{"type":"journal_entries","value":7}', false, 15, 25),
('journal_30_entries', 'Soul Searcher', 'Write 30 journal entries', 'Journal', 'uncommon', 'pen-line', '{"type":"journal_entries","value":30}', false, 40, 50),
('journal_100_entries', 'Chronicle Keeper', 'Write 100 journal entries', 'Journal', 'rare', 'scroll-text', '{"type":"journal_entries","value":100}', false, 100, 100),
('journal_365_entries', 'Year of Words', 'Write 365 journal entries', 'Journal', 'mythic', 'book-heart', '{"type":"journal_entries","value":365}', false, 500, 500),

-- Social category
('social_first_friend', 'First Bond', 'Add your first friend', 'Social', 'common', 'user-plus', '{"type":"friends_count","value":1}', false, 5, 25),
('social_5_friends', 'Squad', 'Have 5 friends', 'Social', 'common', 'users', '{"type":"friends_count","value":5}', false, 15, 25),
('social_10_friends', 'Popular', 'Have 10 friends', 'Social', 'uncommon', 'heart-handshake', '{"type":"friends_count","value":10}', false, 30, 50),
('social_25_friends', 'Social Butterfly', 'Have 25 friends', 'Social', 'rare', 'party-popper', '{"type":"friends_count","value":25}', false, 75, 100),
('social_join_guild', 'Guild Recruit', 'Join your first guild', 'Social', 'common', 'shield', '{"type":"guilds_joined","value":1}', false, 10, 25),
('social_100_messages', 'Chatterbox', 'Send 100 guild messages', 'Social', 'uncommon', 'message-circle', '{"type":"guild_messages_sent","value":100}', false, 30, 50),
('social_500_messages', 'Guild Legend', 'Send 500 guild messages', 'Social', 'epic', 'message-square-text', '{"type":"guild_messages_sent","value":500}', false, 150, 250),

-- Community category
('community_first_post', 'First Voice', 'Create your first community post', 'Community', 'common', 'megaphone', '{"type":"community_posts","value":1}', false, 5, 25),
('community_10_posts', 'Active Contributor', 'Create 10 community posts', 'Community', 'uncommon', 'message-square', '{"type":"community_posts","value":10}', false, 30, 50),
('community_50_posts', 'Community Pillar', 'Create 50 community posts', 'Community', 'rare', 'landmark', '{"type":"community_posts","value":50}', false, 75, 100),
('community_100_posts', 'Influencer', 'Create 100 community posts', 'Community', 'epic', 'radio-tower', '{"type":"community_posts","value":100}', false, 200, 250),

-- Finance category (extended)
('finance_first_tx', 'First Transaction', 'Log your first transaction', 'Finance', 'common', 'receipt', '{"type":"transactions_logged","value":1}', false, 5, 25),
('finance_50_tx', 'Money Tracker', 'Log 50 transactions', 'Finance', 'uncommon', 'wallet', '{"type":"transactions_logged","value":50}', false, 30, 50),
('finance_100_tx', 'Financial Analyst', 'Log 100 transactions', 'Finance', 'rare', 'bar-chart-2', '{"type":"transactions_logged","value":100}', false, 75, 100),
('finance_1_month', 'Month Closed', 'Validate your first financial month', 'Finance', 'common', 'calendar-check', '{"type":"finance_months_validated","value":1}', false, 10, 25),
('finance_6_months', 'Half Year Discipline', 'Validate 6 financial months', 'Finance', 'rare', 'trending-up', '{"type":"finance_months_validated","value":6}', false, 100, 100),
('finance_12_months', 'Annual Master', 'Validate 12 financial months', 'Finance', 'epic', 'crown', '{"type":"finance_months_validated","value":12}', false, 250, 250),

-- Wishlist category
('wishlist_first_item', 'Window Shopper', 'Add your first wishlist item', 'Wishlist', 'common', 'heart', '{"type":"wishlist_items_added","value":1}', false, 5, 25),
('wishlist_10_items', 'Curator', 'Add 10 wishlist items', 'Wishlist', 'uncommon', 'list', '{"type":"wishlist_items_added","value":10}', false, 20, 50),
('wishlist_acquire_5', 'Collector', 'Acquire 5 wishlist items', 'Wishlist', 'rare', 'gift', '{"type":"wishlist_items_acquired","value":5}', false, 75, 100),
('wishlist_acquire_10', 'Completionist', 'Acquire 10 wishlist items', 'Wishlist', 'epic', 'package-check', '{"type":"wishlist_items_acquired","value":10}', false, 150, 250),

-- Calendar category
('calendar_first_event', 'Time Keeper', 'Create your first calendar event', 'Calendar', 'common', 'calendar-plus', '{"type":"calendar_events_created","value":1}', false, 5, 25),
('calendar_10_events', 'Scheduler', 'Create 10 calendar events', 'Calendar', 'common', 'calendar-days', '{"type":"calendar_events_created","value":10}', false, 15, 25),
('calendar_50_events', 'Time Architect', 'Create 50 calendar events', 'Calendar', 'uncommon', 'calendar-range', '{"type":"calendar_events_created","value":50}', false, 40, 50),
('calendar_100_events', 'Chrono Master', 'Create 100 calendar events', 'Calendar', 'rare', 'calendar-clock', '{"type":"calendar_events_created","value":100}', false, 100, 100),

-- Shop category
('shop_first_module', 'Module Unlocked', 'Purchase your first module', 'Shop', 'uncommon', 'package-open', '{"type":"modules_purchased","value":1}', false, 25, 50),
('shop_3_modules', 'Power User', 'Purchase 3 modules', 'Shop', 'rare', 'boxes', '{"type":"modules_purchased","value":3}', false, 75, 100),
('shop_all_modules', 'Full Arsenal', 'Purchase all available modules', 'Shop', 'mythic', 'grid-3x3', '{"type":"modules_purchased","value":8}', false, 500, 500),
('shop_first_cosmetic', 'Style Upgrade', 'Purchase your first cosmetic', 'Shop', 'common', 'palette', '{"type":"cosmetics_owned","value":1}', false, 10, 25),
('shop_10_cosmetics', 'Fashionista', 'Own 10 cosmetic items', 'Shop', 'rare', 'sparkle', '{"type":"cosmetics_owned","value":10}', false, 100, 100),
('shop_spend_1000', 'Big Spender', 'Spend 1000 bonds total', 'Shop', 'uncommon', 'coins', '{"type":"bonds_spent_total","value":1000}', false, 30, 50),
('shop_spend_5000', 'Whale', 'Spend 5000 bonds total', 'Shop', 'epic', 'gem', '{"type":"bonds_spent_total","value":5000}', false, 200, 250),
('shop_spend_10000', 'Tycoon', 'Spend 10000 bonds total', 'Shop', 'legendary', 'diamond', '{"type":"bonds_spent_total","value":10000}', false, 500, 1000),

-- Module-gated achievements
('health_30_checkins', 'Health Devotee', 'Complete 30 health check-ins (requires Health module)', 'ModuleGated', 'rare', 'heart-pulse', '{"type":"consecutive_login_days","value":30}', false, 100, 100),
('focus_marathon', 'Focus Marathon', 'Complete 50 pomodoro sessions (requires Focus module)', 'ModuleGated', 'rare', 'target', '{"type":"pomodoro_sessions","value":50}', false, 100, 100),
('finance_guru', 'Finance Guru', 'Validate 6 months (requires Finance module)', 'ModuleGated', 'epic', 'calculator', '{"type":"finance_months_validated","value":6}', false, 200, 250),
('journal_sage', 'Journal Sage', 'Write 50 entries (requires Journal module)', 'ModuleGated', 'epic', 'feather', '{"type":"journal_entries","value":50}', false, 200, 250),
('calendar_pro', 'Calendar Pro', 'Create 30 events (requires Calendar module)', 'ModuleGated', 'rare', 'calendar-heart', '{"type":"calendar_events_created","value":30}', false, 100, 100),
('wishlist_master', 'Wishlist Master', 'Acquire 10 items (requires Wishlist module)', 'ModuleGated', 'epic', 'star', '{"type":"wishlist_items_acquired","value":10}', false, 200, 250),
('social_networker', 'Social Networker', 'Have 15 friends (requires Community module)', 'ModuleGated', 'rare', 'globe', '{"type":"friends_count","value":15}', false, 100, 100),
('todo_powerhouse', 'Todo Powerhouse', 'Complete 200 todos (requires Todo module)', 'ModuleGated', 'epic', 'rocket', '{"type":"todos_completed","value":200}', false, 200, 250),

-- Hidden achievements
('hidden_midnight_goal', 'Night Owl', 'Complete a goal between midnight and 1am', 'Hidden', 'rare', 'moon', '{"type":"midnight_logins_count","value":5}', true, 75, 100),
('hidden_speed_demon', 'Speed Demon', 'Complete a goal within 3 minutes of creating it', 'Hidden', 'epic', 'zap', '{"type":"speed_complete","value":1}', true, 150, 250),
('hidden_shopaholic', 'Shopaholic', 'Own items from every cosmetic category', 'Hidden', 'rare', 'shopping-bag', '{"type":"cosmetics_owned","value":5}', true, 100, 100),
('hidden_perfectionist', 'Perfectionist', 'Complete all steps of 10 different goals', 'Hidden', 'epic', 'check-check', '{"type":"goals_completed_total","value":10}', true, 200, 250),
('hidden_zen_master', 'Zen Master', 'Have 0 active todos for an entire day', 'Hidden', 'rare', 'flower-2', '{"type":"todos_completed","value":0}', true, 75, 100),

-- Legendary/Mythic tier
('legend_365_streak', 'Eternal Flame', '365-day login streak', 'Legendary', 'legendary', 'flame', '{"type":"consecutive_login_days","value":365}', false, 1000, 1000),
('legend_all_modules', 'Omniscient', 'Own every single module', 'Legendary', 'mythic', 'infinity', '{"type":"modules_purchased","value":8}', false, 750, 500),
('legend_10_impossible', 'Beyond Limits', 'Complete 10 impossible goals', 'Legendary', 'mythic', 'sword', '{"type":"impossible_goals_completed","value":10}', false, 1000, 500),
('legend_master_all', 'Pantheon', 'Unlock 50 other achievements', 'Legendary', 'legendary', 'trophy', '{"type":"goals_completed_total","value":50}', false, 500, 1000),
('legend_1000_steps', 'Path Walker', 'Complete 1000 steps across all goals', 'Legendary', 'legendary', 'footprints', '{"type":"steps_completed_total","value":1000}', false, 500, 1000)

ON CONFLICT (key) DO UPDATE SET
  bond_reward = EXCLUDED.bond_reward,
  points = EXCLUDED.points,
  required_module = EXCLUDED.required_module;

-- Set required_module for module-gated achievements
UPDATE public.achievement_definitions SET required_module = 'track-health' WHERE key = 'health_30_checkins';
UPDATE public.achievement_definitions SET required_module = 'focus-timer' WHERE key = 'focus_marathon';
UPDATE public.achievement_definitions SET required_module = 'track-finance' WHERE key = 'finance_guru';
UPDATE public.achievement_definitions SET required_module = 'neural-journal' WHERE key = 'journal_sage';
UPDATE public.achievement_definitions SET required_module = 'schedule-hub' WHERE key = 'calendar_pro';
UPDATE public.achievement_definitions SET required_module = 'pact-wishlist' WHERE key = 'wishlist_master';
UPDATE public.achievement_definitions SET required_module = 'community-hub' WHERE key = 'social_networker';
UPDATE public.achievement_definitions SET required_module = 'todo-matrix' WHERE key = 'todo_powerhouse';

-- Also set bond_reward and points on existing achievements that don't have them
UPDATE public.achievement_definitions SET bond_reward = 5, points = 25 WHERE bond_reward = 0 AND rarity = 'common';
UPDATE public.achievement_definitions SET bond_reward = 15, points = 50 WHERE bond_reward = 0 AND rarity = 'uncommon';
UPDATE public.achievement_definitions SET bond_reward = 50, points = 100 WHERE bond_reward = 0 AND rarity = 'rare';
UPDATE public.achievement_definitions SET bond_reward = 150, points = 250 WHERE bond_reward = 0 AND rarity = 'epic';
UPDATE public.achievement_definitions SET bond_reward = 300, points = 500 WHERE bond_reward = 0 AND rarity = 'mythic';
UPDATE public.achievement_definitions SET bond_reward = 500, points = 1000 WHERE bond_reward = 0 AND rarity = 'legendary';
