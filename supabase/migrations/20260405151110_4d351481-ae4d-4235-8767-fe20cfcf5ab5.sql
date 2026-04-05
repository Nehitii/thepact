
-- Guild Ranks table
CREATE TABLE public.guild_ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#8b5cf6',
  icon text NOT NULL DEFAULT 'shield',
  position integer NOT NULL DEFAULT 0,
  permissions jsonb NOT NULL DEFAULT '{"invite_members":false,"kick_members":false,"manage_announcements":false,"manage_goals":false,"manage_events":false,"manage_ranks":false,"manage_settings":false,"manage_codes":false}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guild_ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view guild ranks"
  ON public.guild_ranks FOR SELECT TO authenticated
  USING (public.is_guild_member(auth.uid(), guild_id));

CREATE POLICY "Officers/owners can manage ranks"
  ON public.guild_ranks FOR ALL TO authenticated
  USING (public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer'))
  WITH CHECK (public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer'));

-- Add rank_id to guild_members
ALTER TABLE public.guild_members ADD COLUMN rank_id uuid REFERENCES public.guild_ranks(id) ON DELETE SET NULL;

-- Guild Messages table
CREATE TABLE public.guild_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (length(content) <= 500),
  reply_to_id uuid REFERENCES public.guild_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guild_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read guild messages"
  ON public.guild_messages FOR SELECT TO authenticated
  USING (public.is_guild_member(auth.uid(), guild_id));

CREATE POLICY "Members can send messages"
  ON public.guild_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_guild_member(auth.uid(), guild_id) AND user_id = auth.uid());

CREATE POLICY "Users can delete own messages"
  ON public.guild_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for guild_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.guild_messages;

-- Guild Events table
CREATE TABLE public.guild_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  created_by uuid NOT NULL,
  max_participants integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guild_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view guild events"
  ON public.guild_events FOR SELECT TO authenticated
  USING (public.is_guild_member(auth.uid(), guild_id));

CREATE POLICY "Officers can manage events"
  ON public.guild_events FOR INSERT TO authenticated
  WITH CHECK (public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer') AND created_by = auth.uid());

CREATE POLICY "Officers can update events"
  ON public.guild_events FOR UPDATE TO authenticated
  USING (public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer'));

CREATE POLICY "Officers can delete events"
  ON public.guild_events FOR DELETE TO authenticated
  USING (public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer'));

-- Guild Event RSVPs
CREATE TABLE public.guild_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.guild_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.guild_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view RSVPs"
  ON public.guild_event_rsvps FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM guild_events ge WHERE ge.id = event_id AND public.is_guild_member(auth.uid(), ge.guild_id)
  ));

CREATE POLICY "Members can RSVP"
  ON public.guild_event_rsvps FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM guild_events ge WHERE ge.id = event_id AND public.is_guild_member(auth.uid(), ge.guild_id)
  ));

CREATE POLICY "Users can update own RSVP"
  ON public.guild_event_rsvps FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own RSVP"
  ON public.guild_event_rsvps FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Add MOTD to guilds
ALTER TABLE public.guilds ADD COLUMN motd text;

-- Add guild XP function
CREATE OR REPLACE FUNCTION public.add_guild_xp(p_guild_id uuid, p_amount integer, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_guild_member(auth.uid(), p_guild_id) THEN
    RAISE EXCEPTION 'Not a guild member';
  END IF;
  UPDATE guilds SET total_xp = total_xp + p_amount WHERE id = p_guild_id;
  INSERT INTO guild_activity_log (guild_id, user_id, action_type, metadata)
  VALUES (p_guild_id, auth.uid(), 'xp_gained', jsonb_build_object('amount', p_amount, 'reason', p_reason));
END;
$$;

-- Update create_guild_with_owner to create default ranks
CREATE OR REPLACE FUNCTION public.create_guild_with_owner(p_name text, p_description text DEFAULT NULL, p_icon text DEFAULT 'shield', p_color text DEFAULT 'violet', p_is_public boolean DEFAULT false, p_max_members integer DEFAULT 25)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_guild_id uuid;
  v_owner_rank_id uuid;
  v_officer_rank_id uuid;
  v_member_rank_id uuid;
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

  -- Create default ranks
  INSERT INTO guild_ranks (guild_id, name, color, icon, position, permissions, is_default)
  VALUES (v_guild_id, 'Owner', '#ef4444', 'crown', 0, '{"invite_members":true,"kick_members":true,"manage_announcements":true,"manage_goals":true,"manage_events":true,"manage_ranks":true,"manage_settings":true,"manage_codes":true}'::jsonb, false)
  RETURNING id INTO v_owner_rank_id;

  INSERT INTO guild_ranks (guild_id, name, color, icon, position, permissions, is_default)
  VALUES (v_guild_id, 'Officer', '#f59e0b', 'shield', 1, '{"invite_members":true,"kick_members":true,"manage_announcements":true,"manage_goals":true,"manage_events":true,"manage_ranks":false,"manage_settings":false,"manage_codes":true}'::jsonb, false)
  RETURNING id INTO v_officer_rank_id;

  INSERT INTO guild_ranks (guild_id, name, color, icon, position, permissions, is_default)
  VALUES (v_guild_id, 'Member', '#8b5cf6', 'user', 2, '{"invite_members":false,"kick_members":false,"manage_announcements":false,"manage_goals":false,"manage_events":false,"manage_ranks":false,"manage_settings":false,"manage_codes":false}'::jsonb, true)
  RETURNING id INTO v_member_rank_id;

  INSERT INTO guild_members (guild_id, user_id, role, rank_id)
  VALUES (v_guild_id, v_user_id, 'owner', v_owner_rank_id);

  INSERT INTO guild_activity_log (guild_id, user_id, action_type, metadata)
  VALUES (v_guild_id, v_user_id, 'guild_created', jsonb_build_object('name', trim(p_name)));

  RETURN jsonb_build_object('success', true, 'guild_id', v_guild_id);
END;
$$;
