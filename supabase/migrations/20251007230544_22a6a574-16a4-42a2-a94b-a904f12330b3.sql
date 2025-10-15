-- Fix security definer view issue by explicitly setting security invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  photo_url,
  created_at
FROM public.users;

-- Grant public access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;