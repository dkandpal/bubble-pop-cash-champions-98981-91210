import { Button } from "@/components/ui/button";
import { GameStats } from "@/types/game";
import { Trophy, Target, Flame, Clock, Sparkles, Share2 } from "lucide-react";
import { Confetti } from "./Confetti";
import { useEffect } from "react";
import { useSound } from "@/hooks/useSound";

interface ResultsScreenProps {
  stats: GameStats;
  onHome: () => void;
  onPublish?: () => void;
}

export const ResultsScreen = ({ stats, onHome, onPublish }: ResultsScreenProps) => {
  const { victory, defeat } = useSound();

  useEffect(() => {
    if (stats.score >= 1500) {
      victory();
    } else {
      defeat();
    }
  }, [stats.score, victory, defeat]);
  const getRank = (score: number) => {
    if (score >= 5000) return { title: 'Master', color: 'text-bubble-purple', icon: '👑' };
    if (score >= 3000) return { title: 'Expert', color: 'text-bubble-blue', icon: '⭐' };
    if (score >= 1500) return { title: 'Pro', color: 'text-bubble-green', icon: '💎' };
    return { title: 'Rookie', color: 'text-bubble-orange', icon: '🎯' };
  };

  const rank = getRank(stats.score);

  return (
    <div className="min-h-screen bg-gradient-sky flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Confetti />
      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 animate-bounce-in">
          <div className="text-6xl">{rank.icon}</div>
          <h2 className="text-4xl font-bold text-foreground">Game Over!</h2>
          <div className={`text-2xl font-bold ${rank.color}`}>{rank.title} Rank</div>
        </div>

        {/* Score Card */}
        <div className="bg-card rounded-3xl p-6 shadow-card space-y-6">
          {/* Main Score */}
          <div className="text-center pb-6 border-b border-border">
            <div className="text-sm text-muted-foreground font-medium mb-2">Final Score</div>
            <div 
              className="text-5xl font-bold animate-score-pop" 
              style={{ 
                color: 'hsl(var(--gold))',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
              }}
            >
              {stats.score.toLocaleString()}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">Accuracy</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.accuracy.toFixed(1)}%
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">Max Combo</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                x{stats.maxCombo}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Bubbles Popped</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.bubblesPopped}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Math.floor(stats.timeElapsed / 60)}:{(stats.timeElapsed % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Prize info */}
        <div className="bg-secondary/20 rounded-2xl p-4 text-center animate-bounce-in">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-secondary" />
          <p className="text-sm font-semibold text-foreground">
            Prize pool calculated based on your rank
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Results available after match completion
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {onPublish && (
            <Button
              size="lg"
              onClick={onPublish}
              className="w-full h-14 text-lg font-bold bg-gradient-button hover:opacity-90 shadow-gold-glow"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Publish This Game
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            onClick={onHome}
            className="w-full h-14 text-lg font-bold border-2"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
