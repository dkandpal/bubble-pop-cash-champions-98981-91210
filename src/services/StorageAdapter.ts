import { supabase } from "@/integrations/supabase/client";
import { GameSpec } from "@/types/gameSpec";

export interface PublishGameResult {
  id: string;
  share_url: string;
  embed_url: string;
}

export interface GameWithCreator {
  id: string;
  title: string;
  tagline?: string;
  tags: string[];
  nsfw: boolean;
  version: string;
  spec: GameSpec;
  user_id: string | null;
  fork_of: string | null;
  view_count: number;
  fork_count: number;
  created_at: string;
  creator?: {
    display_name: string | null;
    photo_url: string | null;
  };
}

class StorageAdapter {
  /**
   * Publishes a game to the public gallery (requires authentication)
   */
  async publishGame(spec: GameSpec, userId: string): Promise<PublishGameResult> {
    console.log('📤 [StorageAdapter] Starting publishGame...');
    
    // Refresh session to ensure it's still valid
    console.log('🔄 [StorageAdapter] Refreshing session...');
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    
    if (sessionError || !session) {
      console.error('❌ [StorageAdapter] Session refresh failed:', sessionError);
      throw new Error('Your session has expired. Please sign in again.');
    }
    
    // Validate access token exists
    if (!session.access_token) {
      console.error('❌ [StorageAdapter] No access token in session');
      throw new Error('Authentication failed. Please sign in again.');
    }
    
    console.log('✅ [StorageAdapter] Session valid, user:', session.user.id);
    console.log('🔑 [StorageAdapter] Token present:', session.access_token.substring(0, 10) + '...' + session.access_token.slice(-10));
    
    // Calculate payload size
    const payloadString = JSON.stringify({ spec });
    const payloadSizeKB = new Blob([payloadString]).size / 1024;
    console.log(`📊 [StorageAdapter] Payload size: ${payloadSizeKB.toFixed(2)} KB`);
    
    // Warn if payload is large (> 1MB)
    if (payloadSizeKB > 1024) {
      console.warn('⚠️ [StorageAdapter] Large payload detected! This may cause timeout issues.');
    }
    
    // Validate payload size (edge functions have a limit)
    if (payloadSizeKB > 6000) { // 6MB limit (Supabase edge functions support up to 6MB)
      throw new Error(`Payload too large (${payloadSizeKB.toFixed(2)} KB). Please reduce the size of your game assets.`);
    }
    
    console.log('🚀 [StorageAdapter] Invoking publish-game edge function...');
    const startTime = Date.now();
    const timeoutMs = 45000; // 45 seconds
    
    try {
      // Create a timeout promise
      let timeoutId: number;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          const elapsed = Date.now() - startTime;
          console.error(`⏱️ [StorageAdapter] Timeout after ${elapsed}ms`);
          reject(new Error(`timeout`)); // Simple error to identify timeout
        }, timeoutMs) as unknown as number;
      });

      // The actual invoke call - properly handle errors
      const invokePromise = supabase.functions.invoke('publish-game', {
        body: { spec },
      }).then(result => {
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ [StorageAdapter] Edge function responded in ${elapsed}ms`);
        
        // Check for errors in the response
        if (result.error) {
          console.error('❌ [StorageAdapter] Edge function returned error:', result.error);
          throw result.error;
        }
        
        if (!result.data) {
          console.error('❌ [StorageAdapter] No data in edge function response');
          throw new Error('No response from publish service');
        }
        
        return result.data;
      });

      // Race between invoke and timeout
      const data = await Promise.race([invokePromise, timeoutPromise]);

      console.log('✅ [StorageAdapter] Game published successfully:', data);
      return data as PublishGameResult;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ [StorageAdapter] Publish failed after ${elapsed}ms:`, error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message === 'timeout') {
          throw new Error(`Request timed out after ${timeoutMs / 1000} seconds. Please try again.`);
        }
        
        // Check for auth errors
        if (error.message.includes('401') || error.message.includes('authentication') || error.message.includes('Unauthorized')) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        
        throw error;
      }
      
      throw new Error('Failed to publish game. Please try again.');
    }
  }

  /**
   * Get a game by ID with creator info
   */
  async getGame(id: string): Promise<GameWithCreator | null> {
    const { data, error } = await supabase.functions.invoke('get-game', {
      body: { id },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Delete a game (owner only)
   */
  async deleteGame(id: string, userId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('delete-game', {
      body: { id, userId },
    });

    if (error) throw error;
  }

  /**
   * List all games created by a user
   */
  async listUserGames(userId: string): Promise<GameWithCreator[]> {
    // Fetch user's games
    const { data: games, error: gamesError } = await supabase
      .from('public_games')
      .select(`
        id,
        title,
        tagline,
        tags,
        nsfw,
        version,
        spec,
        user_id,
        fork_of,
        view_count,
        fork_count,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (gamesError) throw gamesError;
    if (!games || games.length === 0) return [];

    // Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('display_name, photo_url')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
    }

    // Combine the data
    return games.map(game => ({
      ...game,
      spec: game.spec as unknown as GameSpec,
      creator: profile ? {
        display_name: profile.display_name,
        photo_url: profile.photo_url,
      } : undefined,
    })) as GameWithCreator[];
  }


  /**
   * Increment view count for a game
   */
  async incrementViewCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_game_view_count', {
      game_id: id
    });

    if (error) console.error('Failed to increment view count:', error);
  }

  /**
   * Increment fork count for a game
   */
  async incrementForkCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_game_fork_count', {
      game_id: id
    });

    if (error) console.error('Failed to increment fork count:', error);
  }
}

export const storageAdapter = new StorageAdapter();
