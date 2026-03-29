
-- 1. BOND_BALANCE: Remove direct INSERT and UPDATE policies for regular users
-- Keep only SELECT for users and let SECURITY DEFINER functions handle writes
DROP POLICY IF EXISTS "Users can insert their own balance" ON public.bond_balance;
DROP POLICY IF EXISTS "Users can update their own balance" ON public.bond_balance;

-- 2. COMMUNITY_REACTIONS: Replace public SELECT with authenticated-only
DROP POLICY IF EXISTS "Anyone can read reactions" ON public.community_reactions;
DROP POLICY IF EXISTS "Public can read reactions" ON public.community_reactions;
DROP POLICY IF EXISTS "community_reactions_select" ON public.community_reactions;

-- Re-create SELECT policy for authenticated users only
CREATE POLICY "Authenticated users can read reactions"
ON public.community_reactions
FOR SELECT
TO authenticated
USING (true);

-- 3. USER_MODULE_PURCHASES: Remove direct INSERT policy for users
-- Purchases must go through purchase_shop_item / purchase_bundle / purchase_daily_deal SECURITY DEFINER functions
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.user_module_purchases;
DROP POLICY IF EXISTS "Users can purchase modules" ON public.user_module_purchases;
DROP POLICY IF EXISTS "user_module_purchases_insert" ON public.user_module_purchases;

-- 4. USER_2FA_SETTINGS_SAFE view: secure with RLS on the underlying view
-- Since it's a view, we need to ensure it's secured. Drop and recreate with security_invoker
DROP VIEW IF EXISTS public.user_2fa_settings_safe;
CREATE VIEW public.user_2fa_settings_safe
WITH (security_invoker = true)
AS
SELECT user_id, totp_enabled, email_2fa_enabled, created_at, updated_at
FROM public.user_2fa_settings
WHERE user_id = auth.uid();
