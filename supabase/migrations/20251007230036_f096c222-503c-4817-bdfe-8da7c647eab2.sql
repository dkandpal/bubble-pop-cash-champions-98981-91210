-- Add default UUID generation to public_games.id column
ALTER TABLE public.public_games 
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;