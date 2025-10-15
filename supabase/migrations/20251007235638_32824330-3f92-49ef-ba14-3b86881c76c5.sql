-- Drop the overly permissive SELECT policy that exposes claim_token
DROP POLICY IF EXISTS "Anyone can view games for browsing" ON public.public_games;

-- Create secure functions for incrementing counters without exposing claim_token
CREATE OR REPLACE FUNCTION public.increment_game_view_count(game_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.public_games
  SET view_count = view_count + 1
  WHERE id = game_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_game_fork_count(game_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.public_games
  SET fork_count = fork_count + 1
  WHERE id = game_id;
END;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.increment_game_view_count(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_game_fork_count(text) TO anon, authenticated;