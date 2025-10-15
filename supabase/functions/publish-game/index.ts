import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Track publish attempts by IP/user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_PUBLISHES_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_PUBLISHES_PER_HOUR) {
    return false;
  }

  record.count++;
  return true;
}

Deno.serve(async (req) => {
  const requestStartTime = Date.now();
  console.log(`📥 [Edge Function] ${req.method} request received at ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [Edge Function] CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract auth header to authenticate the user
    const authHeader = req.headers.get('authorization');
    console.log('🔐 [Edge Function] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ [Edge Function] No auth header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please sign in to publish games.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate auth header format (should be "Bearer <token>")
    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ [Edge Function] Invalid auth header format:', authHeader.substring(0, 20) + '...');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication format. Please sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log sanitized token info
    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 [Edge Function] Token length:', token.length, 'first 10 chars:', token.substring(0, 10) + '...');
    
    // Validate Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ [Edge Function] Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('🔧 [Edge Function] Creating Supabase client with service role key');
    
    // Create Supabase client with service role key for JWT validation
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authenticated user by validating the JWT token
    console.log('🔍 [Edge Function] Validating JWT token...');
    
    let user;
    let authError;
    
    try {
      // Pass the token to getUser() for proper validation
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      authError = result.error;
      
      if (authError) {
        console.error('❌ [Edge Function] JWT validation failed:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });
      }
    } catch (error) {
      console.error('❌ [Edge Function] Exception during JWT validation:', error);
      return new Response(
        JSON.stringify({ error: 'Authentication service error. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (authError || !user) {
      console.error('❌ [Edge Function] Authentication failed. Error:', authError?.message || 'No user returned');
      return new Response(
        JSON.stringify({ error: 'Your session has expired. Please sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ [Edge Function] User authenticated:', user.id);
    
    // Parse request body and measure size
    const bodyText = await req.text();
    const bodySizeKB = new Blob([bodyText]).size / 1024;
    console.log(`📊 [Edge Function] Request body size: ${bodySizeKB.toFixed(2)} KB`);
    
    const { spec } = JSON.parse(bodyText);
    const userId = user.id;

    // Rate limiting check
    const rateLimitId = userId;
    
    if (!checkRateLimit(rateLimitId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 10 games per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    if (!spec || !spec.metadata || !spec.theme) {
      return new Response(
        JSON.stringify({ error: 'Invalid game spec' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Additional validation for metadata
    if (!spec.metadata.title || spec.metadata.title.length > 60) {
      return new Response(
        JSON.stringify({ error: 'Title is required and must be 60 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (spec.metadata.tagline && spec.metadata.tagline.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Tagline must be 100 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (spec.metadata.tags && (!Array.isArray(spec.metadata.tags) || spec.metadata.tags.length > 10)) {
      return new Response(
        JSON.stringify({ error: 'Maximum 10 tags allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('💾 [Edge Function] Inserting game into database...', { title: spec.metadata.title, userId });
    const dbStartTime = Date.now();

    // Insert game into database
    const { data: game, error: insertError } = await supabase
      .from('public_games')
      .insert({
        title: spec.metadata.title,
        tagline: spec.metadata.tagline,
        tags: spec.metadata.tags || [],
        nsfw: spec.metadata.nsfw || false,
        version: spec.metadata.version || '1.0.0',
        spec,
        user_id: userId,
        view_count: 0,
        fork_count: 0,
      })
      .select()
      .single();

    const dbElapsed = Date.now() - dbStartTime;
    console.log(`⏱️ [Edge Function] Database insert took ${dbElapsed}ms`);

    if (insertError) {
      console.error('❌ [Edge Function] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [Edge Function] Game published successfully:', game.id);

    // Get the origin from the request headers or use environment variable
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://lovable.app';
    
    console.log('Using origin for URLs:', origin);

    const result = {
      id: game.id,
      share_url: `${origin}/play/${game.id}`,
      embed_url: `${origin}/embed/${game.id}`,
    };

    const totalElapsed = Date.now() - requestStartTime;
    console.log(`✅ [Edge Function] Request completed in ${totalElapsed}ms`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const totalElapsed = Date.now() - requestStartTime;
    console.error(`❌ [Edge Function] Error after ${totalElapsed}ms:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
