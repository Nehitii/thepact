
-- 1. community_replies: restrict SELECT
DROP POLICY IF EXISTS "Anyone can view replies" ON public.community_replies;
CREATE POLICY "Authenticated can view replies on public posts"
ON public.community_replies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = community_replies.post_id AND p.is_public = true
  )
);

-- 2. guilds: allow public discovery
CREATE POLICY "Authenticated can view public guilds"
ON public.guilds
FOR SELECT
TO authenticated
USING (is_public = true);

-- 3. guild_invite_codes: allow reading active codes for join flow
CREATE POLICY "Authenticated can read active invite codes"
ON public.guild_invite_codes
FOR SELECT
TO authenticated
USING (is_active = true);

-- 4. user_module_purchases: remove user-facing DELETE
DROP POLICY IF EXISTS "Users can delete their own module purchases" ON public.user_module_purchases;

-- 5. user_recovery_codes: remove all user-facing policies; access only via service role / SECURITY DEFINER
DROP POLICY IF EXISTS "Users can view their own recovery codes" ON public.user_recovery_codes;
DROP POLICY IF EXISTS "Users can insert their own recovery codes" ON public.user_recovery_codes;
DROP POLICY IF EXISTS "Users can update their own recovery codes" ON public.user_recovery_codes;
DROP POLICY IF EXISTS "Users can delete their own recovery codes" ON public.user_recovery_codes;
