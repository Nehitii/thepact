-- 1. user_cosmetics: add RESTRICTIVE policy to make it explicit that
-- direct inserts are forbidden unless caller is admin. SECURITY DEFINER
-- RPCs (purchase_shop_item etc.) bypass RLS and remain unaffected.
DROP POLICY IF EXISTS "Block non-admin direct inserts" ON public.user_cosmetics;
CREATE POLICY "Block non-admin direct inserts"
  ON public.user_cosmetics
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. victory-reels storage: replace the over-permissive SELECT policy
-- so storage access mirrors the table-level privacy flag.
DROP POLICY IF EXISTS "Authenticated users can view victory reels" ON storage.objects;
CREATE POLICY "Victory reels storage respects privacy"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'victory-reels'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1
        FROM public.victory_reels vr
        WHERE vr.is_public = true
          AND vr.video_url LIKE '%' || storage.objects.name
      )
    )
  );
