export interface BubbleTheme {
  label: string;
  emoji: string;
  hex: string;
}

export interface GameTheme {
  themeName: string;
  tagline: string;
  colors: string[];
  bubbles: {
    set: BubbleTheme[];
    spritesheet?: string;
  };
  heroBannerImage?: string;
}

export const DEFAULT_THEME: GameTheme = {
  themeName: "Classic",
  tagline: "The original bubble shooter experience",
  colors: ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7'],
  bubbles: {
    set: [
      { label: 'Red', emoji: '🔴', hex: '#ef4444' },
      { label: 'Yellow', emoji: '🟡', hex: '#eab308' },
      { label: 'Green', emoji: '🟢', hex: '#22c55e' },
      { label: 'Blue', emoji: '🔵', hex: '#3b82f6' },
      { label: 'Purple', emoji: '🟣', hex: '#a855f7' },
    ]
  }
};
