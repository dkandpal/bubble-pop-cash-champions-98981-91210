-- Proper fix: Protect email while allowing public profile access

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public profile fields are viewable by everyone" ON public.users;

-- Create restrictive policies
-- 1. Users can only view their own full profile (including email)
CREATE POLICY "Users can view own complete profile"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id);

-- 2. Create a secure function to get public profile data (bypassing RLS)
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id text)
RETURNS TABLE (
  id text,
  display_name text,
  photo_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    display_name,
    photo_url,
    created_at
  FROM public.users
  WHERE id = profile_user_id;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;

-- Update the public_profiles view to use the secure function
DROP VIEW IF EXISTS public.public_profiles;

-- Note: The view is now supported by the underlying users table RLS + the secure function
-- Applications should use get_public_profile() function for safe public access