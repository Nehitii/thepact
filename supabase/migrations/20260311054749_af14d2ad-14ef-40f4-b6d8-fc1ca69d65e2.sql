
ALTER TABLE profiles ADD COLUMN accent_color text NOT NULL DEFAULT '#5bb4ff';
ALTER TABLE profiles ADD COLUMN font_size integer NOT NULL DEFAULT 16;

ALTER TABLE notification_settings ADD COLUMN quiet_hours_start time DEFAULT NULL;
ALTER TABLE notification_settings ADD COLUMN quiet_hours_end time DEFAULT NULL;

CREATE TABLE blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks" ON blocked_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can block others" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unblock" ON blocked_users FOR DELETE USING (auth.uid() = user_id);
