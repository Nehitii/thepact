-- Ensure every public.* column that conceptually points to a user has a
-- proper FK to auth.users(id) with ON DELETE CASCADE. Idempotent.

DO $$
DECLARE
  con RECORD;
  pairs TEXT[][] := ARRAY[
    ['account_transfers','user_id'],
    ['achievement_tracking','user_id'],
    ['active_missions','user_id'],
    ['bank_transactions','user_id'],
    ['blocked_users','user_id'],
    ['blocked_users','blocked_user_id'],
    ['bond_balance','user_id'],
    ['bond_transactions','user_id'],
    ['calendar_events','user_id'],
    ['categorization_rules','user_id'],
    ['category_budgets','user_id'],
    ['coach_conversations','user_id'],
    ['coach_embeddings','user_id'],
    ['coach_insights','user_id'],
    ['coach_messages','user_id'],
    ['community_posts','user_id'],
    ['community_reactions','user_id'],
    ['community_replies','user_id'],
    ['community_reports','reporter_id'],
    ['daily_quests','user_id'],
    ['debts','user_id'],
    ['decisions','user_id'],
    ['finance','user_id'],
    ['focus_distractions','user_id'],
    ['focus_sessions','user_id'],
    ['friendships','sender_id'],
    ['friendships','receiver_id'],
    ['goal_contracts','owner_id'],
    ['goal_dependencies','user_id'],
    ['guild_activity_log','user_id'],
    ['guild_event_rsvps','user_id'],
    ['guild_goal_contributions','user_id'],
    ['guild_invites','inviter_id'],
    ['guild_invites','invitee_id'],
    ['guild_members','user_id'],
    ['guild_messages','user_id'],
    ['habit_logs','user_id'],
    ['habit_skip_rules','user_id'],
    ['hall_of_fame','user_id'],
    ['health_challenges','user_id'],
    ['health_data','user_id'],
    ['health_settings','user_id'],
    ['health_streaks','user_id'],
    ['journal_entries','user_id'],
    ['life_areas','user_id'],
    ['monthly_finance_validations','user_id'],
    ['net_worth_snapshots','user_id'],
    ['notification_settings','user_id'],
    ['notifications','user_id'],
    ['pact_spending','user_id'],
    ['pacts','user_id'],
    ['pomodoro_sessions','user_id'],
    ['private_messages','sender_id'],
    ['private_messages','receiver_id'],
    ['promo_code_redemptions','user_id'],
    ['push_subscriptions','user_id'],
    ['ranks','user_id'],
    ['recurring_expenses','user_id'],
    ['recurring_income','user_id'],
    ['reviews','user_id'],
    ['savings_goals','user_id'],
    ['security_events','user_id'],
    ['shared_goals','owner_id'],
    ['shared_pacts','owner_id'],
    ['shared_pacts','member_id'],
    ['shop_wishlist','user_id'],
    ['sinking_fund_contributions','user_id'],
    ['sinking_funds','user_id'],
    ['template_ratings','user_id'],
    ['todo_history','user_id'],
    ['todo_stats','user_id'],
    ['todo_tasks','user_id'],
    ['user_2fa_settings','user_id'],
    ['user_accounts','user_id'],
    ['user_achievements','user_id'],
    ['user_automation_rules','user_id'],
    ['user_cosmetics','user_id'],
    ['user_feature_overrides','user_id'],
    ['user_module_purchases','user_id'],
    ['user_recovery_codes','user_id'],
    ['user_roles','user_id'],
    ['user_trusted_devices','user_id'],
    ['user_values','user_id'],
    ['victory_reels','user_id'],
    ['weekly_reviews','user_id'],
    ['wishlist_items','user_id']
  ];
  tbl TEXT;
  col TEXT;
  i INT;
BEGIN
  FOR i IN 1 .. array_length(pairs, 1) LOOP
    tbl := pairs[i][1];
    col := pairs[i][2];

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl AND c.relkind = 'r'
    ) THEN
      RAISE NOTICE 'skip missing table %', tbl;
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = col
    ) THEN
      RAISE NOTICE 'skip missing column %.%', tbl, col;
      CONTINUE;
    END IF;

    FOR con IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_class tf ON tf.oid = c.confrelid
      JOIN pg_namespace nf ON nf.oid = tf.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.contype = 'f'
        AND n.nspname = 'public' AND t.relname = tbl
        AND nf.nspname = 'auth' AND tf.relname = 'users'
        AND a.attname = col
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', tbl, con.conname);
    END LOOP;

    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE',
      tbl, tbl || '_' || col || '_fkey', col
    );
  END LOOP;
END $$;

-- step_status_history.changed_by: preserve audit history with SET NULL
DO $$
DECLARE
  con RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='step_status_history' AND column_name='changed_by'
  ) THEN
    FOR con IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_class tf ON tf.oid = c.confrelid
      JOIN pg_namespace nf ON nf.oid = tf.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.contype='f' AND n.nspname='public' AND t.relname='step_status_history'
        AND nf.nspname='auth' AND tf.relname='users' AND a.attname='changed_by'
    LOOP
      EXECUTE format('ALTER TABLE public.step_status_history DROP CONSTRAINT %I', con.conname);
    END LOOP;
    EXECUTE 'ALTER TABLE public.step_status_history
             ADD CONSTRAINT step_status_history_changed_by_fkey
             FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL';
  END IF;
END $$;