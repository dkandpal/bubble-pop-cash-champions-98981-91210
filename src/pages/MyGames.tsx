import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { storageAdapter, GameWithCreator } from "@/services/StorageAdapter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function MyGames() {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<GameWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadGames();
    }
  }, [user]);

  const loadGames = async () => {
    if (!user) return;
    
    try {
      const userGames = await storageAdapter.listUserGames(user.id);
      setGames(userGames);
    } catch (error: any) {
      toast.error("Failed to load games: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!user || !confirm("Are you sure you want to delete this game?")) return;

    try {
      await storageAdapter.deleteGame(gameId, user.id);
      toast.success("Game deleted successfully");
      loadGames();
    } catch (error: any) {
      toast.error("Failed to delete game: " + error.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">My Published Games</h1>
          <Button onClick={() => navigate("/")}>Home</Button>
        </div>

        {games.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No games yet</CardTitle>
              <CardDescription>
                Create and publish your first bubble shooter game!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card key={game.id}>
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
                    <p className="text-sm text-muted-foreground">
                      Views: {game.view_count} | Forks: {game.fork_count}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/play/${game.id}`)}
                      >
                        Play
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(game.id)}
                      >
                        Delete
                      </Button>
                    </div>
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
