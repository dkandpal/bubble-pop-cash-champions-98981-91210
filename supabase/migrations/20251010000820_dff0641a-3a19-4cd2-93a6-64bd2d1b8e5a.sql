-- Create storage bucket for game assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-assets',
  'game-assets',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Allow public read access to game assets
CREATE POLICY "Public can view game assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-assets');

-- Allow authenticated users to upload game assets
CREATE POLICY "Authenticated users can upload game assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'game-assets' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own game assets
CREATE POLICY "Users can update their game assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'game-assets' AND auth.role() = 'authenticated');

-- Allow users to delete their own game assets
CREATE POLICY "Users can delete their game assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'game-assets' AND auth.role() = 'authenticated');