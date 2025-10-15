import { useState, useEffect, useRef } from "react";
import { GameCanvas } from "./GameCanvas";
import { GameHeader } from "./GameHeader";
import { ParallaxBackground } from "./ParallaxBackground";
import { Button } from "@/components/ui/button";
import { Pause, Play, X } from "lucide-react";
import { Bubble, BubbleColor, GameState, GameStats } from "@/types/game";
import { toast } from "sonner";
import { SeededRandom, FAIL_LINE_Y, findConnectedBubbles, findFloatingBubbles, calculateScore } from "@/utils/gameLogic";
import { useSound } from "@/hooks/useSound";
import { useTheme } from "@/contexts/ThemeContext";

interface GameScreenProps {
  onGameEnd: (stats: GameStats) => void;
  onExit: () => void;
  heroBannerImage?: string;
  gameTitle?: string;
}

const INITIAL_TIME = 120; // 2 minutes
const GRID_COLS = 10;
const GRID_ROWS = 12;
const BUBBLE_RADIUS = 20;

export const GameScreen = ({ onGameEnd, onExit, heroBannerImage, gameTitle }: GameScreenProps) => {
  const { pop, combo, tick } = useSound();
  const { theme } = useTheme();
  
  const BUBBLE_COLORS = theme.bubbles.set.map(b => b.label);
  const [gameState, setGameState] = useState<GameState>({
    bubbles: [],
    currentBubble: null,
    nextBubble: null,
    score: 0,
    maxCombo: 0,
    timeRemaining: INITIAL_TIME,
    status: 'idle',
    seed: Date.now(),
    bubblesPoppedByType: {},
  });
  const [shootingBubble, setShootingBubble] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const shotsTotal = useRef(0);
  const shotsHit = useRef(0);
  const [rng, setRng] = useState<SeededRandom | null>(null);
  const [poppingBubbles, setPoppingBubbles] = useState<Array<{ bubble: Bubble; startTime: number }>>([]);
  const [fallingBubbles, setFallingBubbles] = useState<Array<{ 
    bubble: Bubble; 
    startTime: number; 
    vy: number; 
    vx: number; 
    rotation: number;
  }>>([]);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameState.status !== 'playing' || !hasStarted) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          // Calculate stats with timeRemaining = 0 for accurate time display
          const finalState = { ...prev, timeRemaining: 0, status: 'finished' as const };
          const stats: GameStats = {
            score: finalState.score,
            accuracy: shotsTotal.current > 0 ? Math.round((shotsHit.current / shotsTotal.current) * 100) : 0,
            maxCombo: finalState.maxCombo,
            timeElapsed: INITIAL_TIME - finalState.timeRemaining,
            bubblesPopped: shotsHit.current,
          };
          
          setTimeout(() => onGameEnd(stats), 0);
          return finalState;
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.status, hasStarted]);

  const initializeGame = () => {
    const seed = Date.now();
    const randomGen = new SeededRandom(seed);
    setRng(randomGen);
    
    const initialBubbles = generateInitialBubbles(randomGen);
    const current = generateRandomBubble(randomGen);
    const next = generateRandomBubble(randomGen);
    
    // Initialize bubble pop counters for each color
    const initialPops: Record<string, number> = {};
    theme.bubbles.set.forEach(bubble => {
      initialPops[bubble.hex] = 0;
    });
    
    setGameState({
      bubbles: initialBubbles,
      currentBubble: current,
      nextBubble: next,
      score: 0,
      maxCombo: 0,
      timeRemaining: INITIAL_TIME,
      status: 'playing',
      seed,
      bubblesPoppedByType: initialPops,
    });
    shotsTotal.current = 0;
    shotsHit.current = 0;
    toast.success("Game Started! Clear all bubbles!");
  };

  const generateInitialBubbles = (randomGen: SeededRandom): Bubble[] => {
    const bubbles: Bubble[] = [];
    const bubbleSize = BUBBLE_RADIUS * 2;
    const offsetX = 20;
    const topY = 60;

    // Generate 10 cols × 12 rows, with bottom 3 rows empty
    for (let row = 0; row < GRID_ROWS - 3; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const rowOffset = row % 2 === 0 ? 0 : bubbleSize / 2;
        const x = offsetX + col * bubbleSize + rowOffset;
        const y = topY + row * bubbleSize;

        const bubbleIndex = Math.floor(randomGen.next() * theme.bubbles.set.length);
        const bubbleTheme = theme.bubbles.set[bubbleIndex];

        bubbles.push({
          id: `${row}-${col}`,
          x,
          y,
          color: bubbleTheme.label,
          emoji: bubbleTheme.emoji,
          row,
          col,
        });
      }
    }

    return bubbles;
  };

  const generateRandomBubble = (randomGen: SeededRandom): Bubble => {
    const bubbleIndex = Math.floor(randomGen.next() * theme.bubbles.set.length);
    const bubbleTheme = theme.bubbles.set[bubbleIndex];
    
    return {
      id: `bubble-${Date.now()}-${randomGen.next()}`,
      x: 200,
      y: 550,
      color: bubbleTheme.label,
      emoji: bubbleTheme.emoji,
    };
  };

  const handleShoot = (angle: number) => {
    if (!gameState.currentBubble || shootingBubble) return;

    // Start timer on first shot
    if (!hasStarted) {
      setHasStarted(true);
    }

    const speed = 20; // 2.5× faster for snappier shooting
    setShootingBubble({
      ...gameState.currentBubble,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });

    shotsTotal.current += 1;
  };

  const handleBubbleLanded = (landedBubble: Bubble) => {
    if (!rng) return;
    
    const newBubbles = [...gameState.bubbles, landedBubble];
    
    // Check for fail line violation
    const hasCrossedFailLine = newBubbles.some(b => b.y >= FAIL_LINE_Y);
    if (hasCrossedFailLine) {
      toast.error("Bubbles reached the fail line!");
      endGame();
      return;
    }
    
    // Check for matches
    const matchingBubbles = findConnectedBubbles(newBubbles, landedBubble, landedBubble.color);
    
    if (matchingBubbles.length >= 3) {
      // Update bubble pop counter
      setGameState(prev => {
        const newPops = { ...prev.bubblesPoppedByType };
        matchingBubbles.forEach(bubble => {
          const bubbleTheme = theme.bubbles.set.find(b => b.label === bubble.color);
          if (bubbleTheme) {
            newPops[bubbleTheme.hex] = (newPops[bubbleTheme.hex] || 0) + 1;
          }
        });
        return { ...prev, bubblesPoppedByType: newPops };
      });

      // Start popping animation
      const now = performance.now();
      setPoppingBubbles(matchingBubbles.map(bubble => ({ bubble, startTime: now })));
      
      // Add floating text for each popped bubble
      setTimeout(() => {
        matchingBubbles.forEach(bubble => {
          const bubbleTheme = theme.bubbles.set.find(b => b.label === bubble.color);
          const color = bubbleTheme?.hex || '#ffffff';
          // @ts-ignore
          window.addCanvasFloatingText?.('+10', bubble.x, bubble.y, color);
        });

        // Show combo text and ring if 4+ bubbles
        if (matchingBubbles.length >= 4) {
          const centerX = matchingBubbles.reduce((sum, b) => sum + b.x, 0) / matchingBubbles.length;
          const centerY = matchingBubbles.reduce((sum, b) => sum + b.y, 0) / matchingBubbles.length;
          // @ts-ignore
          window.addCanvasFloatingText?.(`COMBO!`, centerX, centerY - 30, '#ffd700');
          // @ts-ignore
          window.addCanvasComboRing?.(centerX, centerY);
        }
      }, 100);

      // Sound effects
      if (matchingBubbles.length >= 4) {
        combo();
      } else {
        pop();
      }

      // Vibration
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Remove matching bubbles after animation
      setTimeout(() => {
        const remainingBubbles = newBubbles.filter(
          b => !matchingBubbles.find(m => m.id === b.id)
        );
        
        // Check for floating bubbles
        const floatingBubbles = findFloatingBubbles(remainingBubbles);
        
        // Start falling animation for floating bubbles
        if (floatingBubbles.length > 0) {
          const fallStart = performance.now();
          setFallingBubbles(floatingBubbles.map(bubble => ({
            bubble,
            startTime: fallStart,
            vy: 0,
            vx: 0,
            rotation: 0,
          })));

          // Add floating text for falling bubbles
          setTimeout(() => {
            floatingBubbles.forEach(bubble => {
              // @ts-ignore
              window.addCanvasFloatingText?.('+5', bubble.x, bubble.y, '#888888');
            });
          }, 100);
        }

        const finalBubbles = remainingBubbles.filter(
          b => !floatingBubbles.find(f => f.id === b.id)
        );
        
        // Calculate score per specification
        const points = calculateScore(matchingBubbles.length, floatingBubbles.length);
        
        // Update max combo
        const newMaxCombo = matchingBubbles.length >= 4 
          ? Math.max(gameState.maxCombo, matchingBubbles.length)
          : gameState.maxCombo;
        
        setGameState(prev => ({
          ...prev,
          bubbles: finalBubbles,
          currentBubble: prev.nextBubble,
          nextBubble: generateRandomBubble(rng),
          score: prev.score + points,
          maxCombo: newMaxCombo,
        }));
        
        shotsHit.current += 1;
        
        if (matchingBubbles.length >= 4) {
          toast.success(`Combo! ${matchingBubbles.length} bubbles! +${points} points!`);
        }
        
        // Check win condition
        if (finalBubbles.length === 0) {
          toast.success("🎉 You cleared all bubbles!");
          endGame();
        }

        // Clear popping bubbles
        setPoppingBubbles([]);
        
        // Clear falling bubbles after animation completes
        setTimeout(() => {
          setFallingBubbles([]);
        }, 500); // Reduced to 0.5s as specified
      }, 200);
    } else {
      // No match
      setGameState(prev => ({
        ...prev,
        bubbles: newBubbles,
        currentBubble: prev.nextBubble,
        nextBubble: generateRandomBubble(rng),
      }));
    }
    
    setShootingBubble(null);
  };

  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      status: prev.status === 'playing' ? 'paused' : 'playing',
    }));
  };

  const endGame = () => {
    setGameState(prev => {
      const stats: GameStats = {
        score: prev.score,
        accuracy: shotsTotal.current > 0 ? Math.round((shotsHit.current / shotsTotal.current) * 100) : 0,
        maxCombo: prev.maxCombo,
        timeElapsed: INITIAL_TIME - prev.timeRemaining,
        bubblesPopped: shotsHit.current,
      };
      
      setTimeout(() => onGameEnd(stats), 0);
      
      return { ...prev, status: 'finished' };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col relative">
      <ParallaxBackground backgroundImage={theme.heroBannerImage} />
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full p-4 relative z-10">
        {/* Hero Image */}
        {heroBannerImage && (
          <div className="mb-4 relative">
            <img 
              src={heroBannerImage} 
              alt="Game theme"
              className="w-full max-w-xs mx-auto rounded-xl shadow-lg border-2 border-white/10"
            />
            {gameTitle && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent rounded-b-xl p-4 mx-auto max-w-xs">
                <h2 className="text-white text-2xl font-bold text-center drop-shadow-lg">
                  {gameTitle}
                </h2>
              </div>
            )}
          </div>
        )}
        
        <GameHeader
          score={gameState.score}
          timeRemaining={gameState.timeRemaining}
          maxCombo={gameState.maxCombo}
          theme={theme}
          bubblesPoppedByType={gameState.bubblesPoppedByType}
          spritesheetUrl={theme.bubbles.spritesheet}
        />

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full bg-card/50 backdrop-blur-sm rounded-3xl p-4 shadow-card">
            <GameCanvas
              gameState={gameState}
              onShoot={handleShoot}
              shootingBubble={shootingBubble}
              onBubbleLanded={handleBubbleLanded}
              poppingBubbles={poppingBubbles}
              fallingBubbles={fallingBubbles}
              theme={theme}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={togglePause}
            className="flex-1 font-semibold"
          >
            {gameState.status === 'playing' ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={onExit}
            className="flex-1 font-semibold"
          >
            <X className="w-5 h-5 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
};