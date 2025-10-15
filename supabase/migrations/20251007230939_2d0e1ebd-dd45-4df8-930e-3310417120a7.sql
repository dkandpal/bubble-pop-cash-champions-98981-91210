-- Recreate public_profiles view with proper security

-- Create view using SECURITY DEFINER to safely expose public fields
CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker = false) AS
SELECT 
  id,
  display_name,
  photo_url,
  created_at
FROM public.users;

-- Grant SELECT on view to all users
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add comment documenting the security model
COMMENT ON VIEW public.public_profiles IS 
'Public view of user profiles excluding sensitive data like email. Uses security_invoker=false to allow public read access while keeping the underlying users table protected.';