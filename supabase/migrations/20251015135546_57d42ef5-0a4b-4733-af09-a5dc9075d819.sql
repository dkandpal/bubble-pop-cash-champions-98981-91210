-- Trigger types regeneration by adding a helpful comment to the public_games table
COMMENT ON TABLE public.public_games IS 'Publicly published games that users can browse and play';

-- Ensure all tables have proper comments for documentation
COMMENT ON TABLE public.users IS 'User profile information including email and display details';
COMMENT ON TABLE public.public_profiles IS 'Publicly visible user profile information';

-- Add comment to clarify the relationship
COMMENT ON COLUMN public.public_games.user_id IS 'References the user who published this game';