import { GameTheme } from './theme';

/**
 * Game configuration settings
 */
export interface GameSettings {
  timeLimit: number;      // seconds
  gridCols: number;        // number of columns
  gridRows: number;        // number of rows
  bubbleRadius: number;    // pixel radius
  initialRows: number;     // rows filled at start (gridRows - this = empty rows)
}

/**
 * Game metadata
 */
export interface GameMetadata {
  title: string;
  tagline?: string;
  tags: string[];
  nsfw: boolean;
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Complete game specification
 * This is what gets stored in the database and shared
 */
export interface GameSpec {
  metadata: GameMetadata;
  theme: GameTheme;
  settings: GameSettings;
}

/**
 * Default game settings matching current implementation
 */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  timeLimit: 120,        // 2 minutes
  gridCols: 10,
  gridRows: 12,
  bubbleRadius: 20,
  initialRows: 9,        // 12 - 3 = 9 rows filled
};

/**
 * Helper to create a complete game spec from a theme
 */
export function createGameSpec(
  theme: GameTheme,
  metadata: Partial<GameMetadata> = {},
  settings: Partial<GameSettings> = {}
): GameSpec {
  return {
    metadata: {
      title: metadata.title || theme.themeName,
      tagline: metadata.tagline || theme.tagline,
      tags: metadata.tags || [],
      nsfw: metadata.nsfw || false,
      version: metadata.version || '1.0.0',
      createdAt: metadata.createdAt || new Date().toISOString(),
      updatedAt: metadata.updatedAt || new Date().toISOString(),
    },
    theme,
    settings: {
      ...DEFAULT_GAME_SETTINGS,
      ...settings,
    },
  };
}
