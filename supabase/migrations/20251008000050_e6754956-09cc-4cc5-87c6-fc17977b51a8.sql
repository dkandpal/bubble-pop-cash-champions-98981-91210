-- Fix public_profiles access by adding a public SELECT policy to users table
-- The public_profiles view already filters to show only non-sensitive fields:
-- (id, display_name, photo_url, created_at)

-- Add policy to allow anyone to view public profile information
-- This policy will be used when querying through the public_profiles view
CREATE POLICY "Public profile information is viewable by everyone"
  ON public.users
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON POLICY "Public profile information is viewable by everyone" ON public.users IS 
'Allows public read access to user profiles. The public_profiles view restricts this to non-sensitive fields only.';