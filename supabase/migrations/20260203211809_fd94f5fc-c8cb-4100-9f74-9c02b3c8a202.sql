-- Enable RLS on the safe view
ALTER VIEW public.user_2fa_settings_safe SET (security_invoker = on);

-- Note: Views with security_invoker inherit RLS from the base table.
-- Since the base table now denies all SELECT, we need a different approach.
-- Let's create a SECURITY DEFINER function instead that safely returns only enabled status.

-- Create a secure function to check 2FA status without exposing secrets
CREATE OR REPLACE FUNCTION public.get_user_2fa_status(p_user_id uuid)
RETURNS TABLE (totp_enabled boolean, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT totp_enabled, created_at, updated_at
  FROM public.user_2fa_settings
  WHERE user_id = p_user_id
    AND p_user_id = auth.uid()  -- Only allow users to query their own status
$$;