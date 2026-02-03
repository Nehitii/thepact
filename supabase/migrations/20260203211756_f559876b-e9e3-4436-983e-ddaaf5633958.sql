-- Create a safe view that excludes the totp_secret field
-- This view only exposes whether 2FA is enabled, not the secret itself
CREATE VIEW public.user_2fa_settings_safe
WITH (security_invoker = on) AS
  SELECT 
    user_id,
    totp_enabled,
    created_at,
    updated_at
  FROM public.user_2fa_settings;

-- Drop the existing SELECT policy that exposes totp_secret
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public.user_2fa_settings;

-- Create a new SELECT policy that denies direct access to the base table
-- Only the edge function with service role can access the full table
CREATE POLICY "No direct SELECT access to 2FA secrets" 
ON public.user_2fa_settings 
FOR SELECT 
USING (false);

-- Grant SELECT on the safe view to authenticated users
GRANT SELECT ON public.user_2fa_settings_safe TO authenticated;