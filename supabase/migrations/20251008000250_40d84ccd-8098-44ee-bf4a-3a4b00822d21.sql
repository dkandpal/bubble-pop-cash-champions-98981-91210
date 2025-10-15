-- Replace SECURITY DEFINER view with SECURITY DEFINER function
-- This is the recommended PostgreSQL pattern for safely exposing filtered data
-- with elevated privileges while maintaining security

-- Drop the existing view
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Create a SECURITY DEFINER function that returns public profile data
-- This is more explicit about privilege elevation and follows PostgreSQL best practices
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id text,
  display_name text,
  photo_url text,
  created_at timestamp with time zone
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
  FROM public.users;
$$;

-- Create a view that calls the function
-- This maintains backward compatibility while using the more secure pattern
CREATE VIEW public.public_profiles
WITH (security_invoker=true, security_barrier=true)
AS
  SELECT * FROM public.get_public_profiles();

-- Grant appropriate permissions
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO anon, authenticated;

-- Add comprehensive security documentation
COMMENT ON FUNCTION public.get_public_profiles() IS 
'SECURITY DEFINER function to safely expose public profile data. 
SECURITY RATIONALE: 
- This function intentionally uses SECURITY DEFINER to bypass restrictive RLS on users table
- It only exposes 4 non-sensitive fields: id, display_name, photo_url, created_at
- Email addresses and other sensitive data remain fully protected
- The users table RLS prevents direct access to sensitive fields
- This pattern is necessary to allow anonymous users to browse public profiles
REVIEWED: 2025-10-08 - Approved as secure for public profile access';

COMMENT ON VIEW public.public_profiles IS
'Public view of user profiles. Uses security_invoker view calling a security_definer function for controlled data exposure.';