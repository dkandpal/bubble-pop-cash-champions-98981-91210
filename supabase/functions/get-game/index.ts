import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { id } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Game ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching game:', id);

    // Fetch game using secure SECURITY DEFINER function that excludes claim_token
    // This prevents claim_token exposure even if RLS policies change
    const { data: gameData, error: fetchError } = await supabase
      .rpc('get_game_public', { game_id: id });

    if (fetchError) throw fetchError;
    if (!gameData || gameData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const game = gameData[0];

    // Fetch creator info separately
    let creator = null;
    if (game.user_id) {
      const { data: profileData } = await supabase
        .rpc('get_public_profile', { profile_user_id: game.user_id });
      
      if (profileData && profileData.length > 0) {
        creator = {
          display_name: profileData[0].display_name,
          photo_url: profileData[0].photo_url
        };
      }
    }

    console.log('Game fetched successfully:', game.id);

    // Increment view count using the secure RPC function
    supabase
      .rpc('increment_game_view_count', { game_id: id })
      .then(({ error }) => {
        if (error) console.error('Failed to increment view count:', error);
      });

    return new Response(
      JSON.stringify({ ...game, creator }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get game error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
