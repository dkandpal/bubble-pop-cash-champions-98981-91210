-- Revert the overly permissive policy and fix properly
-- Drop the policy that exposes all user data
DROP POLICY IF EXISTS "Public profile information is viewable by everyone" ON public.users;

-- Recreate public_profiles as a SECURITY DEFINER view with security_barrier
-- This is safe because:
-- 1. The view only exposes non-sensitive fields (id, display_name, photo_url, created_at)
-- 2. security_barrier=true prevents query optimization attacks
-- 3. It runs with elevated privileges but with strict column filtering

DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles 
WITH (security_invoker=false, security_barrier=true)
AS
  SELECT 
    id,
    display_name,
    photo_url,
    created_at
  FROM public.users;

-- Grant SELECT access to everyone for the view only
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 
'Security definer view that safely exposes only public, non-sensitive profile fields. The security_barrier option prevents optimization attacks. The underlying users table remains protected with restrictive RLS policies that prevent direct access to sensitive fields like email.';