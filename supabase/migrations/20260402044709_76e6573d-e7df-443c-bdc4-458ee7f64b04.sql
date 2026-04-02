
-- 1. Add last_seen_at to profiles for online status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT NULL;

-- 2. Create mutual friends count function
CREATE OR REPLACE FUNCTION public.get_mutual_friends_count(p_user_id uuid, p_other_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM (
    SELECT CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END AS fid
    FROM friendships WHERE status = 'accepted' AND (sender_id = p_user_id OR receiver_id = p_user_id)
  ) a
  INNER JOIN (
    SELECT CASE WHEN sender_id = p_other_id THEN receiver_id ELSE sender_id END AS fid
    FROM friendships WHERE status = 'accepted' AND (sender_id = p_other_id OR receiver_id = p_other_id)
  ) b ON a.fid = b.fid;
$$;

-- 3. Allow guild members to be updated (for role changes by owner/officer)
CREATE POLICY "Owner can update member roles"
  ON public.guild_members
  FOR UPDATE
  TO authenticated
  USING (get_guild_role(auth.uid(), guild_id) = 'owner')
  WITH CHECK (get_guild_role(auth.uid(), guild_id) = 'owner');

-- 4. Allow guild ownership transfer (owner can update guilds table)
-- Check if update policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guilds' AND policyname = 'Owner can update guild'
  ) THEN
    EXECUTE 'CREATE POLICY "Owner can update guild" ON public.guilds FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())';
  END IF;
END $$;
