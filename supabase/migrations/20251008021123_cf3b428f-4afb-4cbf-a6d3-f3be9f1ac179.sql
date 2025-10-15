-- Drop the unused view that could bypass RLS
DROP VIEW IF EXISTS public.public_games_public_v1 CASCADE;

-- Note: The public_games table already provides secure public access
-- through the 'public_can_browse_games' RLS policy that allows
-- everyone to SELECT from the table directly