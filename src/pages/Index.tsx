import { useState } from "react";
import { HomeScreen } from "@/components/game/HomeScreen";
import { GameScreen } from "@/components/game/GameScreen";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { PublishGameForm } from "@/components/publish/PublishGameForm";
import { PublishSuccessScreen } from "@/components/publish/PublishSuccessScreen";
import { GameStats } from "@/types/game";
import { GameSpec } from "@/types/gameSpec";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { storageAdapter, PublishGameResult } from "@/services/StorageAdapter";
import { toast } from "sonner";

type Screen = 'home' | 'game' | 'results' | 'publish' | 'published';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [publishResult, setPublishResult] = useState<PublishGameResult | null>(null);
  const { theme } = useTheme();
  const { user } = useAuth();

  const handlePlayClick = () => {
    setCurrentScreen('game');
  };

  const handleGameEnd = (stats: GameStats) => {
    setGameStats(stats);
    setCurrentScreen('results');
  };

  const handleHome = () => {
    setCurrentScreen('home');
  };

  const handleExit = () => {
    setCurrentScreen('home');
  };

  const handlePublishClick = () => {
    if (!user) {
      toast.error("Please sign in to publish games");
      return;
    }
    setCurrentScreen('publish');
  };

  const handlePublish = async (spec: GameSpec) => {
    if (!user) {
      toast.error("Please sign in to publish games");
      return;
    }
    
    try {
      const result = await storageAdapter.publishGame(spec, user.id);
      setPublishResult(result);
      setCurrentScreen('published');
      toast.success("Game published successfully!");
    } catch (error) {
      console.error("Error publishing game:", error);
      toast.error("Failed to publish game");
      throw error;
    }
  };

  const handleCancelPublish = () => {
    setCurrentScreen('results');
  };

  return (
    <>
      {currentScreen === 'home' && <HomeScreen onPlayClick={handlePlayClick} />}
      
      {currentScreen === 'game' && (
        <GameScreen onGameEnd={handleGameEnd} onExit={handleExit} />
      )}
      
      {currentScreen === 'results' && gameStats && (
        <ResultsScreen
          stats={gameStats}
          onHome={handleHome}
          onPublish={user ? handlePublishClick : undefined}
        />
      )}

      {currentScreen === 'publish' && (
        <PublishGameForm
          theme={theme}
          onPublish={handlePublish}
          onCancel={handleCancelPublish}
        />
      )}

      {currentScreen === 'published' && publishResult && (
        <PublishSuccessScreen
          result={publishResult}
          onHome={handleHome}
        />
      )}
    </>
  );
};

export default Index;
