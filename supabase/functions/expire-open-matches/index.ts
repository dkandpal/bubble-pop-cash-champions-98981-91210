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

    console.log('Running expire-open-matches cron job');

    // Find expired open matches
    const { data: expiredMatches, error: findError } = await supabase
      .from('matches')
      .select('id')
      .eq('state', 'open')
      .lt('expires_at', new Date().toISOString());

    if (findError) throw findError;

    console.log(`Found ${expiredMatches?.length || 0} expired matches`);

    if (expiredMatches && expiredMatches.length > 0) {
      const matchIds = expiredMatches.map(m => m.id);

      // Update matches to canceled
      const { error: updateError } = await supabase
        .from('matches')
        .update({ state: 'canceled' })
        .in('id', matchIds);

      if (updateError) throw updateError;

      // Create match_results for each canceled match
      for (const match of expiredMatches) {
        // Get the single entry for this match
        const { data: entry } = await supabase
          .from('entries')
          .select('id, score')
          .eq('match_id', match.id)
          .single();

        if (entry) {
          await supabase
            .from('match_results')
            .insert({
              match_id: match.id,
              entry_a_id: entry.id,
              entry_b_id: entry.id,
              winner_entry_id: null,
              score_a: entry.score,
              score_b: 0,
              outcome: 'canceled'
            });
        }
      }

      console.log(`Expired ${matchIds.length} matches`);
    }

    return new Response(JSON.stringify({
      success: true,
      expired_count: expiredMatches?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
