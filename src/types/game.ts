export type BubbleColor = string;

export interface Bubble {
  id: string;
  x: number;
  y: number;
  color: BubbleColor;
  emoji?: string;
  row?: number;
  col?: number;
}

export interface GameState {
  bubbles: Bubble[];
  currentBubble: Bubble | null; // The bubble in the cannon ready to shoot
  nextBubble: Bubble | null;    // Preview of the next bubble
  score: number;
  maxCombo: number;
  timeRemaining: number;
  status: 'idle' | 'playing' | 'paused' | 'finished';
  seed: number;
  bubblesPoppedByType: Record<string, number>; // Track pops by color
}

export interface GameStats {
  score: number;
  accuracy: number;
  maxCombo: number;
  timeElapsed: number;
  bubblesPopped: number;
}
