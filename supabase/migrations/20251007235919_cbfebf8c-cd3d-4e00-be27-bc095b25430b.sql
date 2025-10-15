-- Fix Security Definer Views by recreating them as Security Invoker views
-- This ensures views respect RLS policies and run with querying user's permissions

-- Drop and recreate public_profiles view with security_invoker
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles 
WITH (security_invoker=true) 
AS
  SELECT 
    id,
    display_name,
    photo_url,
    created_at
  FROM public.users;

-- Drop and recreate public_games_browse view with security_invoker
DROP VIEW IF EXISTS public.public_games_browse CASCADE;

CREATE VIEW public.public_games_browse 
WITH (security_invoker=true)
AS
  SELECT 
    id,
    title,
    tagline,
    tags,
    nsfw,
    version,
    spec,
    user_id,
    fork_of,
    view_count,
    fork_count,
    created_at
  FROM public.public_games;

-- Grant appropriate access to the views
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.public_games_browse TO anon, authenticated;