import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storageAdapter, GameWithCreator } from "@/services/StorageAdapter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GameScreen } from "@/components/game/GameScreen";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { PublishedGameHome } from "@/components/game/PublishedGameHome";
import { GameStats } from "@/types/game";
import { useTheme } from "@/contexts/ThemeContext";

export default function PlayGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [game, setGame] = useState<GameWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<"home" | "playing" | "results">("home");
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    if (id) {
      loadGame(id);
    }
  }, [id]);

  const loadGame = async (gameId: string) => {
    try {
      const gameData = await storageAdapter.getGame(gameId);
      if (!gameData) {
        toast.error("Game not found");
        navigate("/browse");
        return;
      }
      setGame(gameData);
      setTheme(gameData.spec.theme);
    } catch (error: any) {
      toast.error("Failed to load game: " + error.message);
      navigate("/browse");
    } finally {
      setLoading(false);
    }
  };

  const handleGameEnd = (gameStats: GameStats) => {
    setStats(gameStats);
    setGameState("results");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
        <p className="text-white">Loading game...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
        <p className="text-white">Game not found</p>
      </div>
    );
  }

  return (
    <>
      {gameState === "home" ? (
        <PublishedGameHome
          game={game}
          onPlayClick={() => setGameState("playing")}
          onHomeClick={() => navigate("/browse")}
        />
      ) : gameState === "playing" ? (
        <GameScreen
          onGameEnd={handleGameEnd}
          onExit={() => setGameState("home")}
          heroBannerImage={game.spec.theme.heroBannerImage}
          gameTitle={game.spec.metadata.title}
        />
      ) : stats ? (
        <ResultsScreen
          stats={stats}
          onHome={() => setGameState("home")}
        />
      ) : null}
    </>
  );
}
