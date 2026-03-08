
-- =============================================
-- Guilds system
-- =============================================
CREATE TABLE public.guilds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'shield',
  color text DEFAULT 'violet',
  owner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.guild_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(guild_id, user_id)
);

CREATE TABLE public.guild_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(guild_id, invitee_id)
);

-- =============================================
-- Shared Goals
-- =============================================
CREATE TABLE public.shared_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  shared_with_id uuid NOT NULL,
  shared_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, shared_with_id)
);

-- =============================================
-- Shared Pacts
-- =============================================
CREATE TABLE public.shared_pacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pact_id uuid NOT NULL REFERENCES public.pacts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  member_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(pact_id, member_id)
);

-- =============================================
-- Active pact selector on profiles
-- =============================================
ALTER TABLE public.profiles ADD COLUMN active_pact_id uuid REFERENCES public.pacts(id) ON DELETE SET NULL;

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_pacts ENABLE ROW LEVEL SECURITY;

-- Helper: check guild membership
CREATE OR REPLACE FUNCTION public.is_guild_member(_user_id uuid, _guild_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.guild_members WHERE user_id = _user_id AND guild_id = _guild_id);
$$;

-- Helper: check guild role
CREATE OR REPLACE FUNCTION public.get_guild_role(_user_id uuid, _guild_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.guild_members WHERE user_id = _user_id AND guild_id = _guild_id;
$$;

-- Guilds policies
CREATE POLICY "Guild owner full access" ON public.guilds FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Guild members can view" ON public.guilds FOR SELECT TO authenticated
  USING (public.is_guild_member(auth.uid(), id));

-- Guild members policies
CREATE POLICY "Members can view own guild members" ON public.guild_members FOR SELECT TO authenticated
  USING (public.is_guild_member(auth.uid(), guild_id));

CREATE POLICY "Owner/officers can manage members" ON public.guild_members FOR INSERT TO authenticated
  WITH CHECK (public.get_guild_role(auth.uid(), guild_id) IN ('owner', 'officer'));

CREATE POLICY "Owner can delete members" ON public.guild_members FOR DELETE TO authenticated
  USING (
    public.get_guild_role(auth.uid(), guild_id) = 'owner'
    OR user_id = auth.uid()
  );

-- Guild invites policies
CREATE POLICY "Inviter can create invites" ON public.guild_invites FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid() AND public.is_guild_member(auth.uid(), guild_id));

CREATE POLICY "Users can view own invites" ON public.guild_invites FOR SELECT TO authenticated
  USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

CREATE POLICY "Invitee can update invite" ON public.guild_invites FOR UPDATE TO authenticated
  USING (invitee_id = auth.uid()) WITH CHECK (invitee_id = auth.uid());

CREATE POLICY "Inviter can delete invite" ON public.guild_invites FOR DELETE TO authenticated
  USING (inviter_id = auth.uid());

-- Shared goals policies
CREATE POLICY "Owner can manage shared goals" ON public.shared_goals FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Shared user can view" ON public.shared_goals FOR SELECT TO authenticated
  USING (shared_with_id = auth.uid());

-- Shared pacts policies
CREATE POLICY "Owner can manage shared pacts" ON public.shared_pacts FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Member can view shared pact" ON public.shared_pacts FOR SELECT TO authenticated
  USING (member_id = auth.uid());
