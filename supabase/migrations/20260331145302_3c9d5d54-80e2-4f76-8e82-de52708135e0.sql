
-- 1) Remove direct UPDATE policy on user_2fa_settings (all writes go through edge function + supabaseAdmin)
DROP POLICY IF EXISTS "Users can update own 2FA settings" ON public.user_2fa_settings;

-- Also remove INSERT policy if it exists — edge function uses supabaseAdmin
DROP POLICY IF EXISTS "Users can insert own 2FA settings" ON public.user_2fa_settings;

-- 2) Fix goal-images INSERT policy to scope uploads to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload goal images" ON storage.objects;
CREATE POLICY "Authenticated users can upload goal images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'goal-images'
  AND auth.role() = 'authenticated'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3) Fix victory-reels SELECT policy to require authentication
DROP POLICY IF EXISTS "Users can view public victory reels" ON storage.objects;
CREATE POLICY "Authenticated users can view victory reels"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'victory-reels'
  AND auth.role() = 'authenticated'
);
