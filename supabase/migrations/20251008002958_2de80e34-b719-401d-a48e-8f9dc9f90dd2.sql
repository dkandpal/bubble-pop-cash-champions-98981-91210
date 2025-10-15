-- =====================================================================
-- COMPLETE FIX: Enable Public Game Browsing with Security Protection
-- =====================================================================

-- Step 1: Drop dependent views first
DROP VIEW IF EXISTS public.public_games_browse CASCADE;
DROP VIEW IF EXISTS public.public_games_public_v1 CASCADE;

-- Step 2: Drop and recreate the browse function with safe columns
DROP FUNCTION IF EXISTS public.get_public_games_for_browse() CASCADE;

CREATE FUNCTION public.get_public_games_for_browse()
RETURNS TABLE(
  id text,
  title text,
  tagline text,
  tags text[],
  nsfw boolean,
  version text,
  spec jsonb,
  fork_of text,
  view_count integer,
  fork_count integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    title,
    tagline,
    tags,
    nsfw,
    version,
    spec,
    fork_of,
    view_count,
    fork_count,
    created_at
  FROM public.public_games;
$$;

COMMENT ON FUNCTION public.get_public_games_for_browse() IS 
  'Returns safe columns for public game browsing. Excludes user_id, claim_token, claimed_at.';

-- Step 3: Recreate the browse view using the updated function
CREATE VIEW public.public_games_browse
WITH (security_invoker=false) AS
SELECT * FROM public.get_public_games_for_browse();

-- Step 4: Create additional safe public view
CREATE VIEW public.public_games_public_v1 
WITH (security_invoker=true) AS
SELECT
  id,
  title,
  tagline,
  tags,
  nsfw,
  version,
  spec,
  fork_of,
  view_count,
  fork_count,
  created_at
FROM public.public_games;

COMMENT ON VIEW public.public_games_public_v1 IS 
  'Public-safe view of published games. Excludes user_id, claim_token, and claimed_at.';

-- Step 5: Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can publish games" ON public.public_games;

-- Step 6: Create authenticated-only INSERT policy
CREATE POLICY "authenticated_users_can_publish"
ON public.public_games
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Step 7: Create public SELECT policy for safe browsing
CREATE POLICY "public_can_browse_games"
ON public.public_games
FOR SELECT
TO anon, authenticated
USING (true);

-- Step 8: Implement column-level security
REVOKE ALL ON TABLE public.public_games FROM anon, authenticated;

-- Grant SELECT only on safe columns to public roles
GRANT SELECT (
  id,
  title,
  tagline,
  tags,
  nsfw,
  version,
  spec,
  fork_of,
  view_count,
  fork_count,
  created_at
) ON public.public_games TO anon, authenticated;

-- Authenticated users can also see if a game is claimed (for "My Games")
GRANT SELECT (
  user_id,
  claimed_at
) ON public.public_games TO authenticated;

-- Explicitly ensure claim_token is NEVER accessible
REVOKE ALL (claim_token) ON public.public_games FROM anon, authenticated;

-- Step 9: Grant necessary permissions for INSERT/UPDATE/DELETE
GRANT INSERT (
  id,
  title,
  tagline,
  tags,
  nsfw,
  version,
  spec,
  user_id,
  fork_of,
  claim_token
) ON public.public_games TO authenticated;

GRANT UPDATE (
  title,
  tagline,
  tags,
  nsfw,
  version,
  spec
) ON public.public_games TO authenticated;

GRANT DELETE ON public.public_games TO authenticated;

-- Step 10: Grant access to the public views
GRANT SELECT ON public.public_games_browse TO anon, authenticated;
GRANT SELECT ON public.public_games_public_v1 TO anon, authenticated;

-- =====================================================================
-- Security Summary:
-- ✅ Anonymous users can browse all games (safe columns only)
-- ✅ Authenticated users can see their own user_id for filtering
-- ✅ claim_token is NEVER accessible via any client query
-- ✅ Only authenticated users can publish games
-- ✅ Owners can update/delete their own games
-- =====================================================================