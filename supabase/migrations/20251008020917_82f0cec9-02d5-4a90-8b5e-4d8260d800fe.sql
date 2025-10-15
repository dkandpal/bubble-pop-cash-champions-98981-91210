-- Drop the insecure view that bypasses RLS
DROP VIEW IF EXISTS public.public_games_browse CASCADE;

-- Drop the SECURITY DEFINER function that was bypassing RLS
DROP FUNCTION IF EXISTS public.get_public_games_for_browse() CASCADE;

-- Note: The public_games table already has proper RLS policies:
-- - 'public_can_browse_games' allows everyone to SELECT
-- - 'owners_can_view_own_games' allows owners to view their own games
-- These policies provide secure access without bypassing RLS