import { useEffect, useRef, useState } from "react";
import { GameState, Bubble, BubbleColor } from "@/types/game";
import { GameTheme } from "@/types/theme";
import { useBubbleAssetsContext } from "@/contexts/BubbleAssetsContext";
import { snapToGrid, checkCollision, checkCollisionAlongPath, isValidGridPosition, FAIL_LINE_Y } from "@/utils/gameLogic";

interface GameCanvasProps {
  gameState: GameState;
  onShoot: (angle: number) => void;
  shootingBubble: any;
  onBubbleLanded: (bubble: Bubble) => void;
  poppingBubbles?: Array<{ bubble: Bubble; startTime: number }>;
  fallingBubbles?: Array<{ bubble: Bubble; startTime: number; vy: number; vx: number; rotation: number }>;
  theme: GameTheme;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  startTime: number;
  color: string;
}

interface ComboRing {
  x: number;
  y: number;
  startTime: number;
}

export const GameCanvas = ({ 
  gameState, 
  onShoot, 
  shootingBubble, 
  onBubbleLanded,
  poppingBubbles = [],
  fallingBubbles = [],
  theme
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const [isAiming, setIsAiming] = useState(false);
  const animationFrameRef = useRef<number>();
  const shootingBubblePosRef = useRef<{ x: number; y: number; vx: number; vy: number; rotation: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const comboRingsRef = useRef<ComboRing[]>([]);
  const cannonRecoilRef = useRef(0);
  const aimLineOpacityRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const firstFrameLoggedRef = useRef(false);
  const debugModeRef = useRef(false);
  
  // Use shared asset context
  const assets = useBubbleAssetsContext();

  const CANVAS_WIDTH = 450;
  const CANVAS_HEIGHT = 600;
  const SHOOTER_X = CANVAS_WIDTH / 2;
  const SHOOTER_Y = CANVAS_HEIGHT - 50;
  const BUBBLE_RADIUS = 20;

  const colorMap: Record<string, string> = {};
  const bubbleColors: string[] = [];
  theme.bubbles.set.forEach(b => {
    colorMap[b.label] = b.hex;
    bubbleColors.push(b.hex);
  });

  // Debug: Log color mapping on mount
  useEffect(() => {
    console.log("🎨 Bubble color mapping initialized:");
    console.log("  Theme:", theme.themeName);
    console.log("  Colors:", bubbleColors);
    console.log("  Color map:", colorMap);
    console.log("  Atlas mode:", theme.bubbles.atlasMode);
    console.log("  Spritesheet:", theme.bubbles.spritesheet || "none");
    
    // Validate emojis in theme
    theme.bubbles.set.forEach((b, i) => {
      const isValidEmoji = b.emoji && b.emoji.length <= 4 && !/^[a-zA-Z\s]+$/.test(b.emoji);
      if (!isValidEmoji) {
        console.error(`✗ Invalid emoji at index ${i}:`, {
          label: b.label,
          emoji: b.emoji,
          reason: b.emoji?.length > 4 ? "too long" : "contains text instead of emoji"
        });
      }
    });
  }, [theme]);

  // Debug toggle (press 'D' key)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") {
        debugModeRef.current = !debugModeRef.current;
        console.log(`🐛 Debug mode: ${debugModeRef.current ? "ON" : "OFF"}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Easing functions
  const easeOutBack = (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  // Helper function to find nearest valid position
  const findNearestValidPosition = (
    initialPos: { row: number; col: number; x: number; y: number },
    existingBubbles: Bubble[]
  ): { row: number; col: number; x: number; y: number } | null => {
    // First check if initial position is valid
    if (isValidGridPosition(initialPos, existingBubbles)) {
      return initialPos;
    }

    // Check adjacent positions (6 neighbors in hexagonal grid)
    const { row, col } = initialPos;
    const isEvenRow = row % 2 === 0;
    
    const offsets = isEvenRow
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

    for (const [rowOffset, colOffset] of offsets) {
      const neighborRow = row + rowOffset;
      const neighborCol = col + colOffset;
      
      // Skip invalid grid coordinates
      if (neighborRow < 0 || neighborCol < 0 || neighborCol >= 10) continue;
      
      const bubbleSize = 40; // BUBBLE_RADIUS * 2
      const offsetX = 20;
      const topY = 60;
      const rowOffsetX = neighborRow % 2 === 0 ? 0 : bubbleSize / 2;
      
      const neighborPos = {
        row: neighborRow,
        col: neighborCol,
        x: offsetX + neighborCol * bubbleSize + rowOffsetX,
        y: topY + neighborRow * bubbleSize
      };
      
      if (isValidGridPosition(neighborPos, existingBubbles)) {
        return neighborPos;
      }
    }
    
    return null; // No valid position found
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const handlePointerDown = (e: PointerEvent) => {
      if (gameState.status !== 'playing') return;
      setIsAiming(true);
      updateAimAngle(e);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isAiming) return;
      updateAimAngle(e);
    };

    const handlePointerUp = () => {
      if (isAiming && gameState.status === 'playing') {
        setIsAiming(false);
        onShoot(aimAngle);
        // Trigger cannon recoil
        cannonRecoilRef.current = 10;
      }
    };

    const updateAimAngle = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - SHOOTER_X;
      const dy = y - SHOOTER_Y;
      let angle = Math.atan2(dy, dx);

      angle = Math.max(-Math.PI + 0.2, Math.min(-0.2, angle));
      setAimAngle(angle);
    };

    // Attach all pointer events to document so they work from anywhere on the page
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isAiming, aimAngle, gameState.status, onShoot]);

  // Initialize shooting bubble position
  useEffect(() => {
    if (shootingBubble && !shootingBubblePosRef.current) {
      shootingBubblePosRef.current = {
        x: SHOOTER_X,
        y: SHOOTER_Y,
        vx: shootingBubble.vx,
        vy: shootingBubble.vy,
        rotation: 0,
      };
    } else if (!shootingBubble) {
      shootingBubblePosRef.current = null;
    }
  }, [shootingBubble]);

  // Create particles when bubbles pop
  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ffffff', // White sparkle particles
        life: 0.25,
        maxLife: 0.25,
        size: 4 + Math.random() * 3,
      });
    }
  };

  // Add combo ring
  const addComboRing = (x: number, y: number) => {
    comboRingsRef.current.push({
      x,
      y,
      startTime: performance.now(),
    });
  };

  // Add floating text
  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    floatingTextsRef.current.push({
      id: `${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      startTime: performance.now(),
      color,
    });
  };

  // Helper: Pick sprite ID from manifest based on tags (inline implementation)
  const pickSpriteIdFromManifest = (manifest: any, tags: string[]): string => {
    if (!tags || tags.length === 0) {
      const keys = Object.keys(manifest.sprites);
      return keys.length > 0 ? keys[0] : '';
    }

    const scores = new Map<string, number>();
    for (const tag of tags) {
      const spriteIds = manifest.tagIndex[tag.toLowerCase()] || [];
      for (const id of spriteIds) {
        scores.set(id, (scores.get(id) || 0) + 1);
      }
    }

    let bestId = '';
    let bestScore = -1;
    for (const [id, score] of scores.entries()) {
      if (score > bestScore) {
        bestId = id;
        bestScore = score;
      }
    }

    if (!bestId) {
      const keys = Object.keys(manifest.sprites);
      bestId = keys.length > 0 ? keys[0] : '';
    }

    return bestId;
  };

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // CRITICAL: Don't start rendering until assets are ready
    if (!assets.ready) {
      console.log('⏸️ [ANIMATION] Assets not ready, loop will not start', {
        mode: assets.mode,
        ready: assets.ready,
        timestamp: performance.now()
      });
      return;
    }

    console.log('▶️ [ANIMATION] Starting loop with assets ready', {
      mode: assets.mode,
      timestamp: performance.now()
    });

    const drawBubble = (
      ctx: CanvasRenderingContext2D, 
      bubble: Bubble, 
      options: { scale?: number; opacity?: number; rotation?: number; glow?: boolean } = {}
    ) => {
      const { scale = 1, opacity = 1, rotation = 0, glow = false } = options;

      ctx.save();
      ctx.globalAlpha = opacity;
      
      if (rotation !== 0) {
        ctx.translate(bubble.x, bubble.y);
        ctx.rotate(rotation);
        ctx.translate(-bubble.x, -bubble.y);
      }

      // Glow effect for shooting bubble
      if (glow) {
        const glowGradient = ctx.createRadialGradient(bubble.x, bubble.y, 0, bubble.x, bubble.y, BUBBLE_RADIUS * scale * 1.5);
        glowGradient.addColorStop(0, `${colorMap[bubble.color]}80`);
        glowGradient.addColorStop(1, `${colorMap[bubble.color]}00`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, BUBBLE_RADIUS * scale * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Enhanced glossy gradient
      const gradient = ctx.createRadialGradient(
        bubble.x - 8 * scale,
        bubble.y - 8 * scale,
        5 * scale,
        bubble.x,
        bubble.y,
        BUBBLE_RADIUS * scale
      );

      const color = colorMap[bubble.color];
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.25, color + 'dd');
      gradient.addColorStop(0.7, color);
      gradient.addColorStop(1, color + '88'); // Darker bottom-right shadow

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, BUBBLE_RADIUS * scale, 0, Math.PI * 2);
      ctx.fill();

      // Enhanced top-left shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(bubble.x - 8 * scale, bubble.y - 8 * scale, 7 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Smaller highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(bubble.x - 6 * scale, bubble.y - 6 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, BUBBLE_RADIUS * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Draw icon: Priority = atlas > spritesheet > emoji
      if (assets.mode === "atlas" && assets.atlasManifest && assets.atlasImage?.complete) {
        const spriteId = assets.atlasSpriteIds[bubble.color];
        if (spriteId) {
          const sprite = assets.atlasManifest.sprites[spriteId];
          if (sprite) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const atlasSize = dpr >= 2 ? 128 : 64;
            const frame = sprite.frames[atlasSize];
            
            if (frame) {
              const iconScale = (BUBBLE_RADIUS * 2 * scale * 0.7) / frame.w;
              ctx.drawImage(
                assets.atlasImage,
                frame.x, frame.y, frame.w, frame.h,
                bubble.x - (frame.w * iconScale) / 2,
                bubble.y - (frame.h * iconScale) / 2,
                frame.w * iconScale,
                frame.h * iconScale
              );
            }
          }
        }
      }
      else if (assets.mode === "sheet" && assets.spritesheetImage?.complete) {
        // Calculate source position in spritesheet
        const hexColor = colorMap[bubble.color];
        const iconIndex = bubbleColors.indexOf(hexColor);
        
        if (iconIndex >= 0 && iconIndex < 6) {
          const iconsPerRow = 3;
          const iconSize = 128;
          const sourceX = (iconIndex % iconsPerRow) * iconSize;
          const sourceY = Math.floor(iconIndex / iconsPerRow) * iconSize;
          const sourceSize = iconSize;
          
          // Calculate destination size (fit within bubble radius)
          const drawSize = BUBBLE_RADIUS * 1.3 * scale; // 26px at scale=1
          const iconX = bubble.x - drawSize / 2;
          const iconY = bubble.y - drawSize / 2;
          
          ctx.save();
          
          // Draw cropped section of spritesheet
          ctx.drawImage(
            assets.spritesheetImage,
            sourceX, sourceY, sourceSize, sourceSize, // source rect
            iconX, iconY, drawSize, drawSize           // dest rect
          );
          
          ctx.restore();
        }
      } else if (bubble.emoji) {
        // Fallback: render emoji as before (but validate it's not text)
        const isValidEmoji = bubble.emoji.length <= 4 && !/^[a-zA-Z\s]+$/.test(bubble.emoji);
        if (isValidEmoji) {
          ctx.font = `${20 * scale}px Arial`; // Reduced from 24px
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(bubble.emoji, bubble.x, bubble.y);
        } else {
          console.error("✗ Invalid emoji detected in bubble:", {
            color: bubble.color,
            emoji: bubble.emoji,
            length: bubble.emoji.length,
            reason: "Text word instead of emoji character"
          });
        }
      }

      ctx.restore();
    };

    const drawShooter = (ctx: CanvasRenderingContext2D, recoil: number) => {
      const recoilOffset = Math.sin(aimAngle) * recoil;
      const recoilX = SHOOTER_X - Math.cos(aimAngle) * recoil;
      const recoilY = SHOOTER_Y - Math.sin(aimAngle) * recoil;

      ctx.save();
      ctx.translate(recoilX, recoilY);
      
      const gradient = ctx.createLinearGradient(-30, -20, 30, 20);
      gradient.addColorStop(0, '#7c3aed');
      gradient.addColorStop(1, '#ec4899');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    };

    const drawAimLine = (ctx: CanvasRenderingContext2D, opacity: number) => {
      if (opacity <= 0) return;

      const bubbleColor = colorMap[gameState.currentBubble.color];

      ctx.save();
      ctx.globalAlpha = opacity * 0.8;
      ctx.strokeStyle = bubbleColor;
      ctx.lineWidth = 5;
      ctx.setLineDash([8, 6]);

      let currentX = SHOOTER_X;
      let currentY = SHOOTER_Y;
      let dirX = Math.cos(aimAngle);
      let dirY = Math.sin(aimAngle);
      const lineLength = 300;
      
      let endX = currentX + dirX * lineLength;
      let endY = currentY + dirY * lineLength;
      
      const leftWall = BUBBLE_RADIUS;
      const rightWall = CANVAS_WIDTH - BUBBLE_RADIUS;
      
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      
      if (endX < leftWall || endX > rightWall) {
        const bounceX = endX < leftWall ? leftWall : rightWall;
        const t = (bounceX - currentX) / dirX;
        const bounceY = currentY + dirY * t;
        
        ctx.lineTo(bounceX, bounceY);
        
        dirX = -dirX;
        currentX = bounceX;
        currentY = bounceY;
        
        const bounceEndX = currentX + dirX * (lineLength / 2);
        const bounceEndY = currentY + dirY * (lineLength / 2);
        ctx.lineTo(bounceEndX, bounceEndY);
      } else {
        ctx.lineTo(endX, endY);
      }
      
      ctx.stroke();
      ctx.restore();
    };

    const drawParticles = (ctx: CanvasRenderingContext2D, deltaTime: number) => {
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= deltaTime;
        if (p.life <= 0) return false;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity

        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });
    };

    const drawFloatingTexts = (ctx: CanvasRenderingContext2D, now: number) => {
      floatingTextsRef.current = floatingTextsRef.current.filter(text => {
        const elapsed = (now - text.startTime) / 1000;
        if (elapsed > 0.8) return false;

        const progress = elapsed / 0.8;
        const y = text.y - 60 * progress;
        const scale = progress < 0.5 
          ? 0.8 + 0.4 * (progress * 2)
          : 1.2 - 0.2 * ((progress - 0.5) * 2);
        const alpha = 1 - progress;

        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Gold gradient for combo text
        if (text.text === 'COMBO!') {
          const gradient = ctx.createLinearGradient(text.x - 40, y, text.x + 40, y);
          gradient.addColorStop(0, '#ffd700');
          gradient.addColorStop(0.5, '#ffed4e');
          gradient.addColorStop(1, '#ffd700');
          
          ctx.font = `bold ${20 * scale}px Fredoka, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Gold glow
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 20 * scale;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 4;
          ctx.strokeText(text.text, text.x, y);
          
          ctx.fillStyle = gradient;
          ctx.fillText(text.text, text.x, y);
        } else {
          ctx.font = `bold ${16 * scale}px Fredoka, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 3;
          ctx.strokeText(text.text, text.x, y);
          
          ctx.fillStyle = text.color;
          ctx.fillText(text.text, text.x, y);
        }
        
        ctx.restore();

        return true;
      });
    };

    const drawComboRings = (ctx: CanvasRenderingContext2D, now: number) => {
      comboRingsRef.current = comboRingsRef.current.filter(ring => {
        const elapsed = (now - ring.startTime) / 1000;
        const duration = 0.5;
        if (elapsed > duration) return false;

        const progress = elapsed / duration;
        const radius = 80 * progress;
        const alpha = (1 - progress) * 0.8;

        ctx.save();
        ctx.globalAlpha = alpha;
        
        const gradient = ctx.createRadialGradient(ring.x, ring.y, radius * 0.8, ring.x, ring.y, radius);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        return true;
      });
    };

    const animate = () => {
      const now = performance.now();
      const deltaTime = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;

      // Log asset state on first frame only
      if (!firstFrameLoggedRef.current) {
        console.log('🎬 [FIRST FRAME] Animation started with asset state:', {
          mode: assets.mode,
          ready: assets.ready,
          timestamp: now
        });
        firstFrameLoggedRef.current = true;
      }

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Update cannon recoil (spring back)
      if (cannonRecoilRef.current > 0) {
        cannonRecoilRef.current -= deltaTime * 60;
        if (cannonRecoilRef.current < 0) cannonRecoilRef.current = 0;
      }

      // Update aim line opacity
      if (isAiming && aimLineOpacityRef.current < 1) {
        aimLineOpacityRef.current += deltaTime * 10;
        if (aimLineOpacityRef.current > 1) aimLineOpacityRef.current = 1;
      } else if (!isAiming && aimLineOpacityRef.current > 0) {
        aimLineOpacityRef.current -= deltaTime * 6;
        if (aimLineOpacityRef.current < 0) aimLineOpacityRef.current = 0;
      }

      // Update shooting bubble
      if (shootingBubblePosRef.current) {
        const pos = shootingBubblePosRef.current;
        const oldX = pos.x;
        const oldY = pos.y;
        
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.rotation += 0.1;

        // Wall bounces
        if (pos.x - BUBBLE_RADIUS < 0 || pos.x + BUBBLE_RADIUS > CANVAS_WIDTH) {
          pos.vx = -pos.vx;
          pos.x = pos.x - BUBBLE_RADIUS < 0 ? BUBBLE_RADIUS : CANVAS_WIDTH - BUBBLE_RADIUS;
        }

        // Top collision
        if (pos.y - BUBBLE_RADIUS <= 60) {
          const gridPos = snapToGrid(pos.x, pos.y);
          const validPos = findNearestValidPosition(gridPos, gameState.bubbles);
          
          if (validPos) {
            console.log('🎯 Bubble landed at TOP:', {
              position: { x: pos.x, y: pos.y },
              initialGridPos: gridPos,
              finalGridPos: validPos,
              wasAdjusted: gridPos.row !== validPos.row || gridPos.col !== validPos.col
            });
            
            onBubbleLanded({
              ...shootingBubble,
              ...validPos,
            });
          } else {
            console.warn('⚠️ No valid position found for bubble at top - not placing');
          }
          shootingBubblePosRef.current = null;
        }

        // Bubble collision - check along path to prevent tunneling
        const collision = checkCollisionAlongPath(oldX, oldY, pos.x, pos.y, gameState.bubbles);
        if (collision) {
          const gridPos = snapToGrid(pos.x, pos.y);
          const validPos = findNearestValidPosition(gridPos, gameState.bubbles);
          
          if (validPos) {
            console.log('🎯 Bubble landed via COLLISION:', {
              collisionWith: { x: collision.x, y: collision.y, color: collision.color },
              position: { x: pos.x, y: pos.y },
              initialGridPos: gridPos,
              finalGridPos: validPos,
              wasAdjusted: gridPos.row !== validPos.row || gridPos.col !== validPos.col
            });
            
            onBubbleLanded({
              ...shootingBubble,
              ...validPos,
            });
          } else {
            console.warn('⚠️ No valid position found for bubble after collision - not placing');
          }
          shootingBubblePosRef.current = null;
        }
      }

      // Draw fail line
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(0, FAIL_LINE_Y);
      ctx.lineTo(CANVAS_WIDTH, FAIL_LINE_Y);
      ctx.stroke();
      ctx.restore();

      // Draw grid bubbles
      gameState.bubbles.forEach(bubble => drawBubble(ctx, bubble));

      // Draw popping bubbles with animation
      poppingBubbles.forEach(({ bubble, startTime }) => {
        const elapsed = (now - startTime) / 1000;
        const duration = 0.2;
        if (elapsed < duration) {
          const progress = elapsed / duration;
          const scale = progress < 0.5 ? 1 + 0.2 * easeOutBack(progress * 2) : 1.2 - 1.2 * (progress - 0.5) * 2;
          const opacity = 1 - progress;
          const brightness = 1 + (progress < 0.5 ? progress : 1 - progress) * 0.5;
          
          ctx.save();
          ctx.filter = `brightness(${brightness})`;
          drawBubble(ctx, bubble, { scale, opacity });
          ctx.restore();

          // Create particles at the right moment
          if (elapsed > duration * 0.5 && elapsed < duration * 0.6) {
            createParticles(bubble.x, bubble.y, colorMap[bubble.color], 8);
          }
        }
      });

      // Draw falling bubbles with wobble
      fallingBubbles.forEach(({ bubble, startTime, vy, vx, rotation }) => {
        const elapsed = (now - startTime) / 1000;
        const duration = 0.5; // Reduced to 0.5s
        if (elapsed < duration) {
          const newVy = vy + elapsed * 400; // Gravity
          const newY = bubble.y + newVy * elapsed;
          const newX = bubble.x + Math.sin(elapsed * 3) * 5; // Wobble
          const opacity = 1 - (elapsed / duration);
          const newRotation = rotation + elapsed * 3;

          drawBubble(ctx, { ...bubble, x: newX, y: newY }, { 
            opacity, 
            rotation: newRotation 
          });
        }
      });

      // Draw particles
      drawParticles(ctx, deltaTime);

      // Draw shooter
      drawShooter(ctx, cannonRecoilRef.current);

      // Draw current bubble in cannon
      if (gameState.currentBubble && !shootingBubblePosRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        drawBubble(ctx, {
          ...gameState.currentBubble,
          x: SHOOTER_X,
          y: SHOOTER_Y,
        });
        ctx.restore();
      }

      // Draw shooting bubble with motion trail and glow
      if (shootingBubblePosRef.current) {
        const pos = shootingBubblePosRef.current;
        
        // Motion trail (3 afterimages)
        for (let i = 3; i > 0; i--) {
          const trailX = pos.x - pos.vx * i * 0.5;
          const trailY = pos.y - pos.vy * i * 0.5;
          ctx.save();
          ctx.globalAlpha = 0.15 * (4 - i) / 3;
          drawBubble(ctx, { ...shootingBubble, x: trailX, y: trailY }, { 
            scale: 0.9,
            rotation: pos.rotation - i * 0.05
          });
          ctx.restore();
        }

        // Main shooting bubble with glow
        drawBubble(ctx, { ...shootingBubble, x: pos.x, y: pos.y }, { 
          rotation: pos.rotation,
          glow: true
        });
      }

      // Draw next bubble preview next to shooter
      if (gameState.nextBubble) {
        const previewScale = 0.8;
        const previewX = SHOOTER_X + 60;
        const previewY = SHOOTER_Y;
        
        ctx.save();
        ctx.globalAlpha = 0.85;
        
        // Use drawBubble for consistency with glossy effects
        drawBubble(ctx, { 
          ...gameState.nextBubble, 
          x: previewX, 
          y: previewY 
        }, { 
          scale: previewScale,
          glow: false
        });
        
        ctx.restore();
        
        // Draw NEXT label above the preview bubble
        ctx.save();
        
        // Dark background for better visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(previewX - 28, previewY - 38, 56, 18);
        
        // Draw text outline (dark stroke)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 3;
        ctx.font = 'bold 12px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText('NEXT', previewX, previewY - 25);
        
        // Draw main text (white fill)
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.fillText('NEXT', previewX, previewY - 25);
        ctx.restore();
      }

      // Draw aim line
      drawAimLine(ctx, aimLineOpacityRef.current);

      // Draw combo rings
      drawComboRings(ctx, now);

      // Draw floating texts
      drawFloatingTexts(ctx, now);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, shootingBubble, aimAngle, isAiming, poppingBubbles, fallingBubbles, onBubbleLanded, assets.ready, assets.mode]);

  // Expose methods to parent component
  useEffect(() => {
    // @ts-ignore - Expose methods to window for parent component
    window.addCanvasFloatingText = addFloatingText;
    // @ts-ignore
    window.addCanvasComboRing = addComboRing;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto touch-none cursor-crosshair"
      style={{ maxWidth: '100%' }}
    />
  );
};