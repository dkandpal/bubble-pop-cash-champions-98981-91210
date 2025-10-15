export type AtlasManifest = {
  meta: {
    version: number;
    sizes: number[];
    generatedAt: string;
  };
  sprites: Record<string, {
    tags: string[];
    frames: Record<number, {
      x: number;
      y: number;
      w: number;
      h: number;
    }>;
  }>;
  tagIndex: Record<string, string[]>;
};

export type AtlasSize = 64 | 128;

export type LoadedAtlas = {
  manifest: AtlasManifest;
  image: HTMLImageElement;
  size: AtlasSize;
};
