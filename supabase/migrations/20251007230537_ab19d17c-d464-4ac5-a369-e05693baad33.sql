-- Fix email exposure security issue

-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;

-- 2. Create a restricted policy: users can only view their own full profile
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id);

-- 3. Create a public view that excludes sensitive data (email)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  photo_url,
  created_at
FROM public.users;

-- 4. Grant public access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;