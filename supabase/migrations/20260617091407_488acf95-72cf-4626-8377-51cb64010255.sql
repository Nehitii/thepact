
-- Fix victory-reels storage SELECT policy to respect is_public flag
DROP POLICY IF EXISTS "Authenticated users can view victory reels" ON storage.objects;

CREATE POLICY "Victory reels readable by owner or when public"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'victory-reels'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.victory_reels vr
      WHERE vr.is_public = true
        AND (vr.video_url LIKE '%' || name || '%' OR vr.thumbnail_url LIKE '%' || name || '%')
    )
  )
);

-- Remove direct user DELETE on user_cosmetics; force deletions via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Users can delete their own cosmetics" ON public.user_cosmetics;
