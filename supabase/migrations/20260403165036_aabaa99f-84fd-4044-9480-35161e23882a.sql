
-- =============================================
-- 1. Add new columns to guilds
-- =============================================
ALTER TABLE public.guilds
  ADD COLUMN IF NOT EXISTS max_members integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0;

-- =============================================
-- 2. New tables
-- =============================================
CREATE TABLE public.guild_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guild_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_value integer NOT NULL DEFAULT 100,
  current_value integer NOT NULL DEFAULT 0,
  deadline timestamptz,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guild_goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_goal_id uuid REFERENCES public.guild_goals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  amount integer NOT NULL DEFAULT 1,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guild_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guild_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  action_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 3. Enable RLS on new tables
-- =============================================
ALTER TABLE public.guild_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_activity_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. RLS policies (using existing is_guild_member / get_guild_role)
-- =============================================

-- guild_announcements: members can read, owner/officer can write
CREATE POLICY "Members can read announcements"
  ON public.guild_announcements FOR SELECT TO authenticated
  USING (public.is_guild_member(auth.uid(), guild_id));

CREATE POLICY "Officers can create announcements"
  ON public.guild_announcements FOR INSERT TO authenticated
  WITH CHECK (
    public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer')
    AND author_id = auth.uid()
  );

CREATE POLICY "Author or owner can delete announcements"
  ON public.guild_announcements FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR public.get_guild_role(auth.uid(), guild_id) = 'owner'
  );

-- guild_goals: members can read, owner/officer can write
CREATE POLICY "Members can read guild goals"
  ON public.guild_goals FOR SELECT TO authenticated
  USING (public.is_guild_member(auth.uid(), guild_id));

CREATE POLICY "Officers can manage guild goals"
  ON public.guild_goals FOR INSERT TO authenticated
  WITH CHECK (
    public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer')
    AND created_by = auth.uid()
  );

CREATE POLICY "Officers can update guild goals"
  ON public.guild_goals FOR UPDATE TO authenticated
  USING (public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer'));

CREATE POLICY "Owner can delete guild goals"
  ON public.guild_goals FOR DELETE TO authenticated
  USING (public.get_guild_role(auth.uid(), guild_id) = 'owner');

-- guild_goal_contributions: members can read/contribute
CREATE POLICY "Members can read contributions"
  ON public.guild_goal_contributions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.guild_goals gg
      WHERE gg.id = guild_goal_id
        AND public.is_guild_member(auth.uid(), gg.guild_id)
    )
  );

CREATE POLICY "Members can contribute"
  ON public.guild_goal_contributions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.guild_goals gg
      WHERE gg.id = guild_goal_id
        AND public.is_guild_member(auth.uid(), gg.guild_id)
    )
  );

-- guild_invite_codes: owner/officer can manage, public read for joining
CREATE POLICY "Officers can manage invite codes"
  ON public.guild_invite_codes FOR ALL TO authenticated
  USING (public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer'));

CREATE POLICY "Anyone can read active invite codes"
  ON public.guild_invite_codes FOR SELECT TO authenticated
  USING (is_active = true);

-- guild_activity_log: members can read
CREATE POLICY "Members can read activity"
  ON public.guild_activity_log FOR SELECT TO authenticated
  USING (public.is_guild_member(auth.uid(), guild_id));

-- =============================================
-- 5. SECURITY DEFINER functions to fix RLS issues
-- =============================================

-- Create guild with owner atomically
CREATE OR REPLACE FUNCTION public.create_guild_with_owner(
  p_name text,
  p_description text DEFAULT NULL,
  p_icon text DEFAULT 'shield',
  p_color text DEFAULT 'violet',
  p_is_public boolean DEFAULT false,
  p_max_members integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_guild_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF length(trim(p_name)) < 1 OR length(trim(p_name)) > 40 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Name must be 1-40 characters');
  END IF;

  INSERT INTO guilds (name, description, icon, color, owner_id, is_public, max_members)
  VALUES (trim(p_name), NULLIF(trim(COALESCE(p_description, '')), ''), p_icon, p_color, v_user_id, p_is_public, p_max_members)
  RETURNING id INTO v_guild_id;

  INSERT INTO guild_members (guild_id, user_id, role)
  VALUES (v_guild_id, v_user_id, 'owner');

  INSERT INTO guild_activity_log (guild_id, user_id, action_type, metadata)
  VALUES (v_guild_id, v_user_id, 'guild_created', jsonb_build_object('name', trim(p_name)));

  RETURN jsonb_build_object('success', true, 'guild_id', v_guild_id);
END;
$$;

-- Accept guild invite atomically
CREATE OR REPLACE FUNCTION public.accept_guild_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_invite record;
  v_member_count integer;
  v_max_members integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_invite
  FROM guild_invites
  WHERE id = p_invite_id AND invitee_id = v_user_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite not found or already used');
  END IF;

  -- Check max members
  SELECT max_members INTO v_max_members FROM guilds WHERE id = v_invite.guild_id;
  SELECT count(*) INTO v_member_count FROM guild_members WHERE guild_id = v_invite.guild_id;
  IF v_member_count >= COALESCE(v_max_members, 25) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Guild is full');
  END IF;

  -- Already a member?
  IF EXISTS (SELECT 1 FROM guild_members WHERE guild_id = v_invite.guild_id AND user_id = v_user_id) THEN
    UPDATE guild_invites SET status = 'accepted' WHERE id = p_invite_id;
    RETURN jsonb_build_object('success', true, 'already_member', true);
  END IF;

  UPDATE guild_invites SET status = 'accepted' WHERE id = p_invite_id;

  INSERT INTO guild_members (guild_id, user_id, role)
  VALUES (v_invite.guild_id, v_user_id, 'member');

  INSERT INTO guild_activity_log (guild_id, user_id, action_type)
  VALUES (v_invite.guild_id, v_user_id, 'member_joined');

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Join guild via invite code
CREATE OR REPLACE FUNCTION public.join_guild_via_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_code_record record;
  v_member_count integer;
  v_max_members integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_code_record
  FROM guild_invite_codes
  WHERE code = UPPER(trim(p_code))
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  END IF;

  -- Already a member?
  IF EXISTS (SELECT 1 FROM guild_members WHERE guild_id = v_code_record.guild_id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', true, 'already_member', true);
  END IF;

  -- Check max members
  SELECT max_members INTO v_max_members FROM guilds WHERE id = v_code_record.guild_id;
  SELECT count(*) INTO v_member_count FROM guild_members WHERE guild_id = v_code_record.guild_id;
  IF v_member_count >= COALESCE(v_max_members, 25) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Guild is full');
  END IF;

  UPDATE guild_invite_codes SET current_uses = current_uses + 1 WHERE id = v_code_record.id;

  INSERT INTO guild_members (guild_id, user_id, role)
  VALUES (v_code_record.guild_id, v_user_id, 'member');

  INSERT INTO guild_activity_log (guild_id, user_id, action_type, metadata)
  VALUES (v_code_record.guild_id, v_user_id, 'member_joined', jsonb_build_object('via', 'invite_code'));

  RETURN jsonb_build_object('success', true, 'guild_id', v_code_record.guild_id);
END;
$$;

-- Log guild activity (for internal use by other functions or triggers)
CREATE OR REPLACE FUNCTION public.log_guild_activity(
  p_guild_id uuid, p_user_id uuid, p_action text, p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO guild_activity_log (guild_id, user_id, action_type, metadata)
  VALUES (p_guild_id, p_user_id, p_action, p_metadata);
END;
$$;

-- Enable realtime for guild_announcements & guild_activity_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.guild_announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guild_activity_log;
