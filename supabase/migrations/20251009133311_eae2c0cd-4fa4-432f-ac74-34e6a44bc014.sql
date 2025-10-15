-- Add foreign key constraint from public_games to public_profiles
ALTER TABLE public.public_games
ADD CONSTRAINT fk_public_games_user_id 
FOREIGN KEY (user_id) 
REFERENCES public.public_profiles(id) 
ON DELETE CASCADE;

-- Add index for performance on joins
CREATE INDEX IF NOT EXISTS idx_public_games_user_id 
ON public.public_games(user_id);