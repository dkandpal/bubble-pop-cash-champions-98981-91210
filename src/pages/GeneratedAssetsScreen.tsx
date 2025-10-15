import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Play, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { ParallaxBackground } from "@/components/game/ParallaxBackground";
import { PublishGameForm } from "@/components/publish/PublishGameForm";
import { PublishSuccessScreen } from "@/components/publish/PublishSuccessScreen";
import { storageAdapter } from "@/services/StorageAdapter";
import { createGameSpec } from "@/types/gameSpec";
import { toast } from "sonner";

export default function GeneratedAssetsScreen() {
  const navigate = useNavigate();
  const { theme, resetTheme } = useTheme();
  const { user } = useAuth();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishResult, setPublishResult] = useState<{ id: string; share_url: string; embed_url: string } | null>(null);

  const handlePlayGame = () => {
    navigate("/");
  };

  const handleResetToDefault = () => {
    resetTheme();
    navigate("/theme-generator");
  };

  const handlePublishClick = () => {
    if (!user) {
      toast.error("Please sign in to publish your game");
      navigate("/auth");
      return;
    }
    setShowPublishDialog(true);
  };

  const handlePublish = async (spec: any) => {
    if (!user) {
      toast.error("Please sign in to publish your game");
      return;
    }

    try {
      const result = await storageAdapter.publishGame(spec, user.id);
      setPublishResult(result);
      setShowPublishDialog(false);
      toast.success("Game published successfully!");
    } catch (error: any) {
      console.error("Failed to publish:", error);
      throw error; // Let PublishGameForm handle the error display
    }
  };

  const handleCloseSuccess = () => {
    setPublishResult(null);
    navigate("/my-games");
  };

  // If publish was successful, show success screen
  if (publishResult) {
    return (
      <PublishSuccessScreen
        result={publishResult}
        onHome={handleCloseSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col relative">
      <ParallaxBackground />
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 relative z-10">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {theme.themeName}
          </h1>
          <p className="text-lg text-muted-foreground">{theme.tagline}</p>
        </div>

        {theme.heroBannerImage && (
          <div className="mb-6 w-full">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
              <img 
                src={theme.heroBannerImage} 
                alt={`${theme.themeName} hero banner`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <h2 className="font-helvetica text-5xl md:text-6xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-fade-in">
                  {theme.themeName}
                </h2>
              </div>
            </div>
          </div>
        )}

        <Card className="p-6 mb-6 bg-card/80 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">Preview Your Theme</h2>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Color Palette</h3>
            <div className="flex gap-3 flex-wrap">
              {theme.colors.map((color, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-full shadow-bubble border-2 border-white"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs mt-1 text-muted-foreground">{color}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Bubble Set</h3>
            <div className="flex gap-4 flex-wrap">
              {theme.bubbles.set.map((bubble, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-20 h-20 rounded-full shadow-bubble flex items-center justify-center text-3xl border-2 border-white relative"
                    style={{ backgroundColor: bubble.hex }}
                  >
                    <span className="relative z-10">{bubble.emoji}</span>
                  </div>
                  <span className="text-xs mt-2 font-medium">{bubble.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bubble Spritesheet Preview */}
          {theme.bubbles.spritesheet && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Bubble Icon Spritesheet</h3>
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                <img 
                  src={theme.bubbles.spritesheet} 
                  alt="Bubble spritesheet"
                  className="h-16 border rounded"
                  style={{ imageRendering: 'pixelated' }}
                />
                <p className="text-xs text-muted-foreground">
                  6 custom icons will be used in-game instead of emojis
                </p>
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">How It Works</h3>
            <p className="text-sm text-muted-foreground">
              Your custom theme will be applied to the game! Match bubbles with the same emoji 
              to clear them. The colors and emojis will replace the default game bubbles.
            </p>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleResetToDefault}
            className="flex-1 font-semibold"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Reset to Default
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handlePublishClick}
            className="flex-1 font-semibold"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Publish Game
          </Button>
          <Button
            size="lg"
            onClick={handlePlayGame}
            className="flex-1 font-semibold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
          >
            <Play className="w-5 h-5 mr-2" />
            Play Game
          </Button>
        </div>
      </div>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <PublishGameForm
            theme={theme}
            onPublish={handlePublish}
            onCancel={() => setShowPublishDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
