import { Clock, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSound } from "@/hooks/useSound";
import { GameTheme } from "@/types/theme";
import { loadAtlas, pickSpriteId, drawSprite } from "@/atlas";

interface GameHeaderProps {
  score: number;
  timeRemaining: number;
  maxCombo: number;
  theme: GameTheme;
  bubblesPoppedByType: Record<string, number>;
  spritesheetUrl?: string;
}

export const GameHeader = ({ score, timeRemaining, maxCombo, theme, bubblesPoppedByType, spritesheetUrl }: GameHeaderProps) => {
  const { tick } = useSound();
  const prevTimeRef = useRef(timeRemaining);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const INITIAL_TIME = 120;
  
  const [spritesheetImage, setSpritesheetImage] = useState<HTMLImageElement | null>(null);
  const [atlasData, setAtlasData] = useState<{ manifest: any; image: HTMLImageElement; size: number } | null>(null);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    if (timeRemaining < 10 && timeRemaining !== prevTimeRef.current) {
      tick();
    }
    prevTimeRef.current = timeRemaining;
  }, [timeRemaining, tick]);

  // Load atlas if in atlas mode
  useEffect(() => {
    if (theme.bubbles.atlasMode) {
      // Check if atlas files exist before attempting load
      fetch("/sprites/atlas.json", { method: "HEAD" })
        .then(res => {
          const contentType = res.headers.get('Content-Type');
          if (!res.ok || !contentType?.includes('application/json')) {
            console.log("ℹ️ Atlas files not found in GameHeader. Using spritesheet fallback.");
            setAtlasData(null);
            return;
          }
          
          // Atlas exists, proceed with load
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const atlasSize = (dpr >= 2 ? 128 : 64) as 64 | 128;
          
          return loadAtlas(atlasSize)
            .then(data => setAtlasData(data));
        })
        .catch(err => {
          console.log("ℹ️ Atlas unavailable in GameHeader:", err.message);
          setAtlasData(null);
        });
    }
  }, [theme.bubbles.atlasMode]);

  // Load spritesheet (legacy)
  useEffect(() => {
    if (!spritesheetUrl || theme.bubbles.atlasMode) return;
    
    const img = new Image();
    img.onload = () => setSpritesheetImage(img);
    img.onerror = () => setSpritesheetImage(null);
    img.src = spritesheetUrl;
  }, [spritesheetUrl, theme.bubbles.atlasMode]);

  // Draw bubble icons on canvases
  useEffect(() => {
    // Atlas mode
    if (atlasData) {
      theme.bubbles.set.forEach((bubble) => {
        const canvas = canvasRefs.current[bubble.hex];
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 32;
        canvas.width = size;
        canvas.height = size;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw glossy circle background
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, bubble.hex + 'dd');
        gradient.addColorStop(0.7, bubble.hex);
        gradient.addColorStop(1, bubble.hex + '99');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw shine
        const shineGradient = ctx.createRadialGradient(size / 2 - 4, size / 2 - 4, 0, size / 2, size / 2, size / 2);
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = shineGradient;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw sprite from atlas
        const spriteId = pickSpriteId(atlasData.manifest, bubble.tags || []);
        if (spriteId) {
          drawSprite(ctx, atlasData.image, atlasData.manifest, spriteId, atlasData.size, size / 2, size / 2, 0.6);
        }
      });
      return;
    }

    // Legacy spritesheet mode
    if (!spritesheetImage) return;

    theme.bubbles.set.forEach((bubble, index) => {
      const canvas = canvasRefs.current[bubble.hex];
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 32;
      canvas.width = size;
      canvas.height = size;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Draw glossy circle background
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, bubble.hex + 'dd');
      gradient.addColorStop(0.7, bubble.hex);
      gradient.addColorStop(1, bubble.hex + '99');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw shine
      const shineGradient = ctx.createRadialGradient(size / 2 - 4, size / 2 - 4, 0, size / 2, size / 2, size / 2);
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = shineGradient;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw icon from spritesheet (3×2 grid layout)
      const iconsPerRow = 3;
      const iconSize = 128;
      const sx = (index % iconsPerRow) * iconSize;
      const sy = Math.floor(index / iconsPerRow) * iconSize;
      
      const iconDrawSize = size * 0.6;
      const iconX = (size - iconDrawSize) / 2;
      const iconY = (size - iconDrawSize) / 2;
      
      ctx.drawImage(
        spritesheetImage,
        sx, sy, iconSize, iconSize,
        iconX, iconY, iconDrawSize, iconDrawSize
      );
    });
  }, [atlasData, spritesheetImage, theme.bubbles.set]);

  return (
    <div className="px-4 py-3 bg-card/80 backdrop-blur-sm rounded-2xl shadow-card mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-secondary" fill="currentColor" />
          <div>
            <div className="text-xs text-muted-foreground font-medium">Score</div>
            <div className="text-xl font-bold text-foreground animate-score-pop" style={{ color: 'hsl(var(--gold))' }}>
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-muted-foreground font-medium">Max Combo</div>
          <div className="text-xl font-bold">{maxCombo || '-'}</div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          <div>
            <div className="text-xs text-muted-foreground font-medium">Time</div>
            <div className={`text-xl font-bold ${timeRemaining < 30 ? 'text-destructive' : 'text-foreground'}`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-button transition-all duration-1000 linear ${
            timeRemaining < 10 ? 'animate-pulse-danger' : ''
          }`}
          style={{ width: `${(timeRemaining / INITIAL_TIME) * 100}%` }}
        />
      </div>

      {/* Bubble Type Counters */}
      <div className="flex justify-between items-center gap-2 mt-3 pt-3 border-t border-border/50">
        {theme.bubbles.set.map((bubble) => (
          <div key={bubble.hex} className="flex flex-col items-center gap-1 flex-1">
            {atlasData || spritesheetImage ? (
              <canvas
                ref={(el) => (canvasRefs.current[bubble.hex] = el)}
                className="w-8 h-8"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm"
                style={{ backgroundColor: bubble.hex }}
              >
                {bubble.emoji}
              </div>
            )}
            <div className="text-xs font-medium text-foreground">
              {bubblesPoppedByType[bubble.hex] || 0}
            </div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[60px]">
              {bubble.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
