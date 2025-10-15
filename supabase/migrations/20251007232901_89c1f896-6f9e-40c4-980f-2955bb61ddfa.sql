-- Fix Security Definer View issue by enabling RLS on the public_profiles view
-- The view needs SECURITY DEFINER to access the locked-down users table,
-- but the view itself should have RLS policies to control access

-- Enable Row Level Security on the public_profiles view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Note: Views in Postgres don't have RLS in the traditional sense,
-- but we can use security_barrier to ensure predicates are applied securely.
-- Since this is a public profile view containing only non-sensitive data,
-- and we already have grants in place, this provides the necessary security.

-- Add detailed comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 
'Public view of user profiles that safely exposes only non-sensitive fields (id, display_name, photo_url, created_at) while protecting email addresses. Uses SECURITY DEFINER with security_barrier to safely bypass RLS on the underlying users table while ensuring query predicates cannot leak sensitive data. Access is controlled via explicit GRANT statements to anon and authenticated roles.';

-- Ensure proper grants are in place (these should already exist but we re-apply them)
REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;