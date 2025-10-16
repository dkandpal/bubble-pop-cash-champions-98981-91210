import { useEffect, useState } from "react";
import { GameTheme } from "@/types/theme";
import { AtlasManifest } from "@/atlas/types";

export type AssetMode = "atlas" | "sheet" | "emoji";

export interface BubbleAssets {
  ready: boolean;
  mode: AssetMode;
  atlasImage: HTMLImageElement | null;
  atlasManifest: AtlasManifest | null;
  atlasSpriteIds: Record<string, string>;
  spritesheetImage: HTMLImageElement | null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        await img.decode(); // Wait for decoding to complete
        resolve(img);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = src;
  });
}

async function loadJSON<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

function rectInside(img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  return x >= 0 && y >= 0 && w > 0 && h > 0 &&
         x + w <= img.naturalWidth && y + h <= img.naturalHeight;
}

function atlasLooksSane(atlasImg: HTMLImageElement, atlasManifest: any): boolean {
  if (!atlasManifest?.sprites) return false;
  
  const sprites = Object.values(atlasManifest.sprites);
  if (sprites.length === 0) return false;
  
  // Check first sprite has valid frames
  const firstSprite: any = sprites[0];
  if (!firstSprite?.frames) return false;
  
  // Check at least one frame size exists and is within bounds
  const frames = Object.values(firstSprite.frames) as any[];
  if (frames.length === 0) return false;
  
  const frame = frames[0];
  return frame && rectInside(atlasImg, frame.x, frame.y, frame.w, frame.h);
}

function spritesheetLooksSane(sheet: HTMLImageElement, minW = 64, minH = 64): boolean {
  return sheet.naturalWidth >= minW && sheet.naturalHeight >= minH;
}

function pickSpriteIdFromManifest(manifest: any, tags: string[]): string {
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
}

export function useBubbleAssets(theme: GameTheme): BubbleAssets {
  const [state, setState] = useState<BubbleAssets>({
    ready: false,
    mode: "emoji",
    atlasImage: null,
    atlasManifest: null,
    atlasSpriteIds: {},
    spritesheetImage: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      console.log('🔄 [ASSET LOADER] Starting asset load...', {
        atlasMode: theme.bubbles.atlasMode,
        hasSpritesheet: !!theme.bubbles.spritesheet,
      });

      try {
        // PRIORITY 1: Try atlas if enabled
        if (theme.bubbles.atlasMode) {
          console.log('🎯 [ASSET LOADER] Attempting atlas load...');
          
          // Check if atlas exists first
          const headRes = await fetch("/sprites/atlas.json", { method: "HEAD" });
          const contentType = headRes.headers.get('Content-Type');
          
          if (headRes.ok && contentType?.includes('application/json')) {
            try {
              const dpr = Math.min(window.devicePixelRatio || 1, 2);
              const atlasSize = dpr >= 2 ? 128 : 64;

              // Try WebP first, fallback to PNG
              let atlasImage: HTMLImageElement;
              try {
                atlasImage = await loadImage(`/sprites/atlas-${atlasSize}.webp`);
              } catch {
                console.log('⚠️ [ASSET LOADER] WebP failed, trying PNG...');
                atlasImage = await loadImage(`/sprites/atlas-${atlasSize}.png`);
              }

              const atlasManifest = await loadJSON("/sprites/atlas.json");

              // Validate atlas
              if (atlasLooksSane(atlasImage, atlasManifest)) {
                // Pre-pick sprite IDs for each bubble color
                const pickedIds: Record<string, string> = {};
                theme.bubbles.set.forEach(bubble => {
                  const tags = bubble.tags || [];
                  const spriteId = pickSpriteIdFromManifest(atlasManifest, tags);
                  pickedIds[bubble.label] = spriteId;
                  pickedIds[bubble.hex] = spriteId;
                });

                if (!cancelled) {
                  console.log('✅ [ASSET LOADER] Atlas loaded successfully', {
                    spriteCount: Object.keys(atlasManifest.sprites).length,
                    size: atlasSize,
                  });
                  
                  setState({
                    ready: true,
                    mode: "atlas",
                    atlasImage,
                    atlasManifest,
                    atlasSpriteIds: pickedIds,
                    spritesheetImage: null,
                  });
                  return;
                }
              }
            } catch (atlasError) {
              console.log('⚠️ [ASSET LOADER] Atlas load failed:', (atlasError as Error).message);
            }
          } else {
            console.log('ℹ️ [ASSET LOADER] Atlas not found, trying spritesheet...');
          }
        }

        // PRIORITY 2: Try spritesheet fallback
        if (theme.bubbles.spritesheet) {
          console.log('🎯 [ASSET LOADER] Attempting spritesheet load...');
          try {
            const sheet = await loadImage(theme.bubbles.spritesheet);
            
            if (spritesheetLooksSane(sheet)) {
              if (!cancelled) {
                console.log('✅ [ASSET LOADER] Spritesheet loaded successfully');
                
                setState({
                  ready: true,
                  mode: "sheet",
                  atlasImage: null,
                  atlasManifest: null,
                  atlasSpriteIds: {},
                  spritesheetImage: sheet,
                });
                return;
              }
            }
          } catch (sheetError) {
            console.log('⚠️ [ASSET LOADER] Spritesheet load failed:', (sheetError as Error).message);
          }
        }

        // PRIORITY 3: Fallback to emoji (always works)
        if (!cancelled) {
          console.log('✅ [ASSET LOADER] Using emoji fallback');
          setState({
            ready: true,
            mode: "emoji",
            atlasImage: null,
            atlasManifest: null,
            atlasSpriteIds: {},
            spritesheetImage: null,
          });
        }
      } catch (error) {
        console.error('❌ [ASSET LOADER] Critical error:', error);
        if (!cancelled) {
          setState({
            ready: true,
            mode: "emoji",
            atlasImage: null,
            atlasManifest: null,
            atlasSpriteIds: {},
            spritesheetImage: null,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [theme.bubbles.atlasMode, theme.bubbles.spritesheet, theme.themeName]);

  return state;
}
