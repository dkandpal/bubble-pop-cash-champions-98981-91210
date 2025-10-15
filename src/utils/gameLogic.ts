import { Bubble, BubbleColor } from "@/types/game";

// Seeded Random Number Generator for deterministic gameplay
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

const BUBBLE_RADIUS = 20;
const GRID_COLS = 10;
const GRID_ROWS = 12;
export const FAIL_LINE_Y = 500; // Bubbles below this line trigger game over

export interface GridPosition {
  row: number;
  col: number;
  x: number;
  y: number;
}

export const snapToGrid = (x: number, y: number): GridPosition => {
  const bubbleSize = BUBBLE_RADIUS * 2;
  const offsetX = 20;
  const topY = 60;

  // Calculate row - use floor + 0.5 threshold for better snapping precision
  const rawRow = (y - topY) / bubbleSize;
  const row = Math.max(0, Math.floor(rawRow + 0.5)); // Ensure row >= 0
  
  // Calculate column (accounting for odd row offset)
  const rowOffset = row % 2 === 0 ? 0 : bubbleSize / 2;
  const adjustedX = x - offsetX - rowOffset;
  const rawCol = adjustedX / bubbleSize;
  const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(rawCol + 0.5))); // Clamp to valid range

  // Calculate final position
  const finalX = offsetX + col * bubbleSize + rowOffset;
  const finalY = topY + row * bubbleSize;

  return { row, col, x: finalX, y: finalY };
};

export const findConnectedBubbles = (
  bubbles: Bubble[],
  startBubble: Bubble,
  targetColor: BubbleColor
): Bubble[] => {
  const connected: Bubble[] = [];
  const visited = new Set<string>();
  const queue: Bubble[] = [startBubble];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.row}-${current.col}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (current.color !== targetColor) continue;

    connected.push(current);

    // Find neighbors
    const neighbors = getNeighbors(bubbles, current);
    queue.push(...neighbors.filter(n => !visited.has(`${n.row}-${n.col}`)));
  }

  return connected;
};

export const getNeighbors = (bubbles: Bubble[], bubble: Bubble): Bubble[] => {
  if (bubble.row === undefined || bubble.col === undefined) return [];

  const row = bubble.row;
  const col = bubble.col;
  const isEvenRow = row % 2 === 0;

  // Different neighbor offsets for even/odd rows (hexagonal grid)
  const neighborOffsets = isEvenRow
    ? [
        [-1, -1], [-1, 0],  // top-left, top-right
        [0, -1], [0, 1],     // left, right
        [1, -1], [1, 0],     // bottom-left, bottom-right
      ]
    : [
        [-1, 0], [-1, 1],    // top-left, top-right
        [0, -1], [0, 1],     // left, right
        [1, 0], [1, 1],      // bottom-left, bottom-right
      ];

  const neighbors: Bubble[] = [];

  for (const [rowOffset, colOffset] of neighborOffsets) {
    const neighborRow = row + rowOffset;
    const neighborCol = col + colOffset;

    const neighbor = bubbles.find(
      b => b.row === neighborRow && b.col === neighborCol
    );

    if (neighbor) {
      neighbors.push(neighbor);
    }
  }

  return neighbors;
};

export const findFloatingBubbles = (bubbles: Bubble[]): Bubble[] => {
  // Find all bubbles connected to the top row
  const topBubbles = bubbles.filter(b => b.row === 0);
  const connected = new Set<string>();

  const markConnected = (bubble: Bubble) => {
    const key = `${bubble.row}-${bubble.col}`;
    if (connected.has(key)) return;
    connected.add(key);

    const neighbors = getNeighbors(bubbles, bubble);
    neighbors.forEach(markConnected);
  };

  topBubbles.forEach(markConnected);

  // Return bubbles not connected to top
  return bubbles.filter(b => !connected.has(`${b.row}-${b.col}`));
};

export const checkCollision = (
  x: number,
  y: number,
  bubbles: Bubble[]
): Bubble | null => {
  const collisionDistance = BUBBLE_RADIUS * 2 + 2; // More forgiving collision detection

  for (const bubble of bubbles) {
    const dx = x - bubble.x;
    const dy = y - bubble.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < collisionDistance) {
      return bubble;
    }
  }

  return null;
};

// Check collision along a path to prevent tunneling
export const checkCollisionAlongPath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  bubbles: Bubble[]
): Bubble | null => {
  // Check 5 points along the path
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    
    const collision = checkCollision(x, y, bubbles);
    if (collision) return collision;
  }
  
  return null;
};

// Validate that a grid position doesn't conflict with existing bubbles
export const isValidGridPosition = (
  gridPos: GridPosition,
  existingBubbles: Bubble[]
): boolean => {
  const conflict = existingBubbles.find(
    b => b.row === gridPos.row && b.col === gridPos.col
  );
  return !conflict;
};

export const calculateScore = (
  bubblesPopped: number,
  floatingBubbles: number
): number => {
  // Each popped bubble = +10 points
  const basePoints = bubblesPopped * 10;
  
  // Combo bonus only applies when 4+ bubbles popped in one shot
  const comboBonus = bubblesPopped >= 4 ? 5 * (bubblesPopped - 3) : 0;
  
  // Falling bubbles = +5 each (half points)
  const floatingBonus = floatingBubbles * 5;

  return basePoints + comboBonus + floatingBonus;
};
