import { AtlasManifest, AtlasSize, LoadedAtlas } from './types';

const cache = new Map<AtlasSize, LoadedAtlas>();

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function loadAtlas(size: AtlasSize): Promise<LoadedAtlas> {
  // Check cache first
  if (cache.has(size)) {
    return cache.get(size)!;
  }

  try {
    // Load manifest
    const manifestRes = await fetch("/sprites/atlas.json");
    if (!manifestRes.ok) {
      throw new Error(`Failed to load atlas manifest: ${manifestRes.status}`);
    }
    const manifest: AtlasManifest = await manifestRes.json();

    // Try WebP, fall back to PNG
    let image: HTMLImageElement;
    try {
      image = await loadImage(`/sprites/atlas-${size}.webp`);
    } catch {
      console.warn(`WebP atlas failed, falling back to PNG for size ${size}`);
      image = await loadImage(`/sprites/atlas-${size}.png`);
    }

    const loaded: LoadedAtlas = { manifest, image, size };
    cache.set(size, loaded);
    
    console.log(`✓ Loaded atlas-${size} with ${Object.keys(manifest.sprites).length} sprites`);
    return loaded;
  } catch (error) {
    console.error(`Failed to load atlas for size ${size}:`, error);
    throw error;
  }
}

export function clearAtlasCache(): void {
  cache.clear();
}
