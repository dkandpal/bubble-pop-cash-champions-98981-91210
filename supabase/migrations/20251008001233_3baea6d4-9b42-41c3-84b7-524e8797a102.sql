-- SECURITY FIX: Remove overly permissive policy that exposes claim_token
-- Drop the policy that allows anyone to view all columns including sensitive claim_token
DROP POLICY IF EXISTS "Anyone can view published games" ON public.public_games;

-- Create a secure function to get game data without claim_token
-- This function uses SECURITY DEFINER to bypass RLS and explicitly excludes claim_token
CREATE OR REPLACE FUNCTION public.get_game_public(game_id text)
RETURNS TABLE(
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
  FROM public.public_games
  WHERE id = game_id;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_game_public(text) TO anon, authenticated;

-- Add detailed security comments
COMMENT ON FUNCTION public.get_game_public(text) IS 
'SECURITY DEFINER function to safely retrieve game data for public viewing.
CRITICAL: This function explicitly EXCLUDES claim_token field to prevent token theft.
The claim_token field should only be accessible to:
1. Game owners via the "Owners can view all game data including claim tokens" RLS policy
2. The publish-game edge function when creating games
3. The claim-game edge function when processing ownership claims
All public access MUST go through this function or the public_games_browse view.';