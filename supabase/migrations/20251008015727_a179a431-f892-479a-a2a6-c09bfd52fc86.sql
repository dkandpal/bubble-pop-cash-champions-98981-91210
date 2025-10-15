-- Make user_id required for all games (authenticated only)
ALTER TABLE public.public_games 
ALTER COLUMN user_id SET NOT NULL;

-- Remove claim token columns (no longer needed)
ALTER TABLE public.public_games 
DROP COLUMN IF EXISTS claim_token,
DROP COLUMN IF EXISTS claimed_at;

-- Drop old RLS policies
DROP POLICY IF EXISTS "authenticated_users_can_publish" ON public.public_games;
DROP POLICY IF EXISTS "Owners can view all game data including claim tokens" ON public.public_games;

-- Create simplified INSERT policy for authenticated users only
CREATE POLICY "authenticated_users_can_publish" ON public.public_games
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid())::text = user_id);

-- Update SELECT policy (no longer need to handle claim tokens)
CREATE POLICY "owners_can_view_own_games" ON public.public_games
  FOR SELECT
  TO authenticated
  USING ((auth.uid())::text = user_id);