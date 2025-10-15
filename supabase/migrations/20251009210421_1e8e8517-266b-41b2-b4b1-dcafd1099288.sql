-- Grant SELECT permissions for public browsing of games
GRANT SELECT ON TABLE public.public_games TO anon;
GRANT SELECT ON TABLE public.public_games TO authenticated;

-- Grant SELECT permissions for viewing creator profiles
GRANT SELECT ON TABLE public.public_profiles TO anon;
GRANT SELECT ON TABLE public.public_profiles TO authenticated;

-- Grant SELECT permissions for authenticated users to view user profiles
GRANT SELECT ON TABLE public.users TO authenticated;