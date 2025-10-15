import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { competitionService } from "@/services/CompetitionService";
import { toast } from "sonner";

type Screen = 'home' | 'game' | 'compete' | 'results' | 'publish' | 'published';

const Index = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [publishResult, setPublishResult] = useState<PublishGameResult | null>(null);
  const [isCompetitive, setIsCompetitive] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();

  const handlePlayClick = () => {
    setIsCompetitive(false);
    setCurrentScreen('game');
  };

  const handleCompeteClick = () => {
    setIsCompetitive(true);
    setCurrentScreen('compete');
  };

  const handleGameEnd = async (stats: GameStats) => {
    setGameStats(stats);
    
    if (isCompetitive && user) {
      try {
        const clientSessionId = crypto.randomUUID();
        const response = await competitionService.submitEntry(stats, clientSessionId);
        
        if (response.state === 'waiting') {
          navigate(`/compete/waiting/${response.match_id}`);
        } else if (response.state === 'completed') {
          navigate(`/compete/results/${response.match_id}`);
        }
      } catch (error) {
        console.error("Failed to submit competitive entry:", error);
        toast.error("Failed to submit score");
        setCurrentScreen('results');
      }
    } else {
      setCurrentScreen('results');
    }
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
      {currentScreen === 'home' && (
        <HomeScreen 
          onPlayClick={handlePlayClick}
          onCompeteClick={handleCompeteClick}
        />
      )}
      
      {(currentScreen === 'game' || currentScreen === 'compete') && (
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
