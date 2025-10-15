import { Button } from "@/components/ui/button";
import { Trophy, Home } from "lucide-react";
import { GameWithCreator } from "@/services/StorageAdapter";
import { ParallaxBackground } from "./ParallaxBackground";

interface PublishedGameHomeProps {
  game: GameWithCreator;
  onPlayClick: () => void;
  onHomeClick: () => void;
}

export const PublishedGameHome = ({
  game,
  onPlayClick,
  onHomeClick
}: PublishedGameHomeProps) => {
  return (
    <div className="min-h-screen bg-gradient-sky flex flex-col items-center justify-center p-6 relative">
      <ParallaxBackground backgroundImage={game.spec.theme.heroBannerImage} />
      
      <div className="max-w-md w-full space-y-6 text-center relative z-10">
        {/* Title & Tagline */}
        <div className="space-y-3 animate-float">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-button bg-clip-text text-transparent">
            {game.spec.metadata.title}
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 font-medium">
            {game.spec.metadata.tagline || game.spec.theme.tagline}
          </p>
        </div>

        {/* Hero Image */}
        {game.spec.theme.heroBannerImage && (
          <div className="py-4">
            <img 
              src={game.spec.theme.heroBannerImage} 
              alt={`${game.spec.metadata.title} game preview`}
              className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl border-4 border-white/10"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button 
            size="lg" 
            onClick={onPlayClick} 
            className="w-full h-16 text-xl font-bold bg-gradient-button hover:opacity-90 transition-all shadow-glow animate-pulse-glow"
          >
            <Trophy className="w-6 h-6 mr-2" />
            Play Now!
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            onClick={onHomeClick} 
            className="w-full h-12 text-lg font-semibold"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </Button>
        </div>

        {/* Game Info */}
        <div className="pt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Match 3+ bubbles of the same color to pop them!
          </p>
          <p className="text-xs text-muted-foreground/70">
            Build combos for higher scores • {game.spec.settings.timeLimit} seconds per game
          </p>
        </div>
      </div>
    </div>
  );
};
