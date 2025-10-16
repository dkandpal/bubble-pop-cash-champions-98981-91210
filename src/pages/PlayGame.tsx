import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { storageAdapter, GameWithCreator } from "@/services/StorageAdapter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GameScreen } from "@/components/game/GameScreen";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { PublishedGameHome } from "@/components/game/PublishedGameHome";
import { GameStats } from "@/types/game";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { competitionService } from "@/services/CompetitionService";
import { BubbleAssetsProvider } from "@/contexts/BubbleAssetsContext";

export default function PlayGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTheme } = useTheme();
  const { user } = useAuth();
  const [game, setGame] = useState<GameWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<"home" | "playing" | "results">("home");
  const [stats, setStats] = useState<GameStats | null>(null);
  const isCompetitive = searchParams.get("mode") === "compete";

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

  const handleGameEnd = async (gameStats: GameStats) => {
    setStats(gameStats);
    
    if (isCompetitive && user) {
      try {
        const clientSessionId = crypto.randomUUID();
        // Ensure duration is at least 1 second for competitive play
        const competitiveStats = {
          ...gameStats,
          timeElapsed: Math.max(1, gameStats.timeElapsed)
        };
        const response = await competitionService.submitEntry(competitiveStats, clientSessionId);
        
        if (response.state === 'waiting') {
          navigate(`/compete/waiting/${response.entry_id}`, {
            state: {
              score: gameStats.score,
              accuracy: gameStats.accuracy,
              maxCombo: gameStats.maxCombo,
              bubblesPopped: gameStats.bubblesPopped,
              timeElapsed: gameStats.timeElapsed
            }
          });
        } else if (response.state === 'completed') {
          navigate(`/compete/results/${response.match_id}`);
        }
      } catch (error) {
        console.error("Failed to submit competitive entry:", error);
        toast.error("Failed to submit score");
        setGameState("results");
      }
    } else {
      setGameState("results");
    }
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
    <BubbleAssetsProvider>
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
    </BubbleAssetsProvider>
  );
}
