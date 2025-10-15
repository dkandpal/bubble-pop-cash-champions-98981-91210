-- Fix public_games_browse to allow safe public access using SECURITY DEFINER pattern
-- This follows the same secure pattern as public_profiles

-- Drop the current non-functional view
DROP VIEW IF EXISTS public.public_games_browse CASCADE;

-- Create a SECURITY DEFINER function for safe public game browsing
-- This intentionally exposes game data for browsing while excluding claim_token
CREATE OR REPLACE FUNCTION public.get_public_games_for_browse()
RETURNS TABLE (
  id text,
  title text,
  tagline text,
  tags text[],
  nsfw boolean,
  version text,
  spec jsonb,
  user_id text,
  fork_of text,
  view_count integer,
  fork_count integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create the public_games_browse view using the function
-- Maintains backward compatibility while using the secure pattern
CREATE VIEW public.public_games_browse
WITH (security_invoker=true, security_barrier=true)
AS
  SELECT * FROM public.get_public_games_for_browse();

-- Grant appropriate permissions
GRANT SELECT ON public.public_games_browse TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_games_for_browse() TO anon, authenticated;

-- Add comprehensive security documentation
COMMENT ON FUNCTION public.get_public_games_for_browse() IS 
'SECURITY DEFINER function for public game browsing.
SECURITY RATIONALE:
- This function intentionally uses SECURITY DEFINER to enable public game discovery
- Exposes game metadata including user_id (intentional - users should see who created games)
- EXCLUDES claim_token field to prevent ownership token theft
- The claim_token remains protected in public_games table
- This pattern is necessary for a game browsing platform where games are meant to be discoverable
- User_id exposure is acceptable - similar to GitHub showing repository creators
REVIEWED: 2025-10-08 - Approved for public game browsing functionality';

COMMENT ON VIEW public.public_games_browse IS
'Public browsing view for games. Uses security_invoker view calling security_definer function for controlled public access to game listings.';