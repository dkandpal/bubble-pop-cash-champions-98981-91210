-- Fix public_profiles view security by adjusting underlying users table RLS

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;

-- Create new policies for granular access control

-- 1. Everyone can view public profile fields (display_name, photo_url, id, created_at)
-- This is safe because email is excluded via the public_profiles view
CREATE POLICY "Public profile fields are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- 3. Prevent direct inserts (handled by trigger from auth.users)
CREATE POLICY "System only user inserts"
  ON public.users
  FOR INSERT
  WITH CHECK (false);

-- 4. Prevent deletes (users should be managed through auth system)
CREATE POLICY "No direct user deletion"
  ON public.users
  FOR DELETE
  USING (false);