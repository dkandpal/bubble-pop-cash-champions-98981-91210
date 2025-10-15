import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { match_id } = body;

    if (!match_id) {
      throw new Error('Missing match_id');
    }

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .single();

    if (matchError) throw matchError;

    if (match.state === 'completed') {
      const { data: results, error: resultsError } = await supabase
        .from('match_results')
        .select(`
          *,
          entry_a:entries!match_results_entry_a_id_fkey(player:players(handle)),
          entry_b:entries!match_results_entry_b_id_fkey(player:players(handle))
        `)
        .eq('match_id', match_id)
        .single();

      if (resultsError) throw resultsError;

      return new Response(JSON.stringify({
        state: 'completed',
        results: {
          ...results,
          player_a_handle: results.entry_a?.player?.handle,
          player_b_handle: results.entry_b?.player?.handle,
          completed_at: match.completed_at
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      state: match.state,
      expires_at: match.expires_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
