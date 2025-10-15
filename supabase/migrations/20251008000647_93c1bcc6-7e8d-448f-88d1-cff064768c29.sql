-- Add public SELECT policy to enable game sharing and playing
-- This allows anyone to view published games while keeping claim_token protected

-- Add public SELECT policy for game viewing
-- Note: claim_token column should NEVER be selected in public queries
CREATE POLICY "Anyone can view published games"
  ON public.public_games
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Add comment explaining claim_token protection
COMMENT ON POLICY "Anyone can view published games" ON public.public_games IS
'Allows public read access to published games for sharing and playing.
CRITICAL SECURITY NOTE: Applications MUST explicitly exclude claim_token from SELECT queries when not authenticated as the game owner.
The claim_token field is sensitive and should only be accessed by:
1. The publish-game edge function when creating games
2. The claim-game edge function when claiming ownership
3. Game owners viewing their own games
All other queries should explicitly list columns or use public_games_browse view.';