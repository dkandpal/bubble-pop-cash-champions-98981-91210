import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GameWithCreator } from "@/services/StorageAdapter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Browse() {
  const [games, setGames] = useState<GameWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from("public_games")
        .select(`
          *,
          creator:public_profiles(display_name, photo_url)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setGames((data || []) as unknown as GameWithCreator[]);
    } catch (error: any) {
      toast.error("Failed to load games: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(
    (game) =>
      game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.tagline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
        <p className="text-white">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white">Browse Games</h1>
          <Button onClick={() => navigate("/")}>Create Your Own</Button>
        </div>

        <Input
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-8 max-w-md"
        />

        {filteredGames.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No games found</CardTitle>
              <CardDescription>
                {searchTerm
                  ? "Try a different search term"
                  : "Be the first to publish a game!"}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{game.title}</CardTitle>
                  {game.tagline && (
                    <CardDescription>{game.tagline}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {game.spec?.theme?.heroBannerImage ? (
                    <img
                      src={game.spec.theme.heroBannerImage}
                      alt={`${game.title} hero`}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-[16/9] rounded-xl object-cover shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-full aspect-[16/9] rounded-xl bg-gradient-to-br from-purple-400/30 via-fuchsia-400/30 to-indigo-400/30 grid place-items-center text-sm text-muted-foreground"
                      aria-label="No hero image"
                    >
                      <span className="opacity-60">No preview available</span>
                    </div>
                  )}
                  
                  <div className="space-y-2 mt-3">
                    {game.creator && (
                      <p className="text-sm text-muted-foreground">
                        by {game.creator.display_name || "Anonymous"}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      👁️ {game.view_count} views
                    </p>
                    {game.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {game.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs bg-primary/20 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button
                      className="w-full mt-4"
                      onClick={() => navigate(`/play/${game.id}`)}
                    >
                      Play Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
