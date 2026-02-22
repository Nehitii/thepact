
ALTER TABLE public.user_2fa_settings
  ADD COLUMN IF NOT EXISTS email_2fa_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_code_expires_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_code_attempts integer NOT NULL DEFAULT 0;

DROP FUNCTION IF EXISTS public.get_user_2fa_status(uuid);

CREATE FUNCTION public.get_user_2fa_status(p_user_id uuid)
 RETURNS TABLE(totp_enabled boolean, email_2fa_enabled boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT totp_enabled, email_2fa_enabled, created_at, updated_at
  FROM public.user_2fa_settings
  WHERE user_id = p_user_id
    AND p_user_id = auth.uid()
$$;
