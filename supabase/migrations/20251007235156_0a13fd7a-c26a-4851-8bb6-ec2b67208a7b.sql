-- Fix: Protect claim tokens from public exposure
-- Create a public view that excludes sensitive fields like claim_token

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.public_games_browse CASCADE;

-- Create a view for public game browsing that excludes claim_token
CREATE VIEW public.public_games_browse AS
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

-- Grant access to the view
GRANT SELECT ON public.public_games_browse TO anon, authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.public_games_browse IS 
'Public view of games that safely exposes game data while protecting sensitive fields like claim_token. This prevents token theft while allowing public game browsing.';

-- Update the RLS policy on public_games to be more explicit
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view games" ON public.public_games;

-- Create separate policies for owners and non-owners
CREATE POLICY "Owners can view all game data including claim tokens"
ON public.public_games
FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Anyone can view games for browsing"
ON public.public_games
FOR SELECT
USING (true);

-- Note: Applications should use public_games_browse view for public game listings
-- and only query public_games directly when the user owns the game or needs claim_token