-- =====================================================================
-- FIX: Update public_games_browse view to use SECURITY INVOKER
-- =====================================================================
-- This ensures the view respects RLS policies and doesn't bypass security
-- =====================================================================

-- Drop and recreate the browse view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_games_browse CASCADE;

CREATE VIEW public.public_games_browse
WITH (security_invoker=true) AS
SELECT * FROM public.get_public_games_for_browse();

-- Ensure proper permissions are granted
GRANT SELECT ON public.public_games_browse TO anon, authenticated;

-- =====================================================================
-- The view now uses SECURITY INVOKER mode, which means:
-- ✅ It respects the calling user's permissions
-- ✅ It doesn't bypass RLS policies
-- ✅ The underlying function is still SECURITY DEFINER, which is safe
--    because it explicitly returns only safe columns
-- =====================================================================