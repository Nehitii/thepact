-- Create storage bucket for goal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('goal-images', 'goal-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for goal images bucket
CREATE POLICY "Anyone can view goal images"
ON storage.objects FOR SELECT
USING (bucket_id = 'goal-images');

CREATE POLICY "Authenticated users can upload goal images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'goal-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own goal images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'goal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own goal images"
ON storage.objects FOR DELETE
USING (bucket_id = 'goal-images' AND auth.uid()::text = (storage.foldername(name))[1]);