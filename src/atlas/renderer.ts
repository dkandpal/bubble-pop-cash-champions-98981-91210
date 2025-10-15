import { AtlasManifest } from './types';

/**
 * Draw a sprite from the atlas onto a canvas context
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  atlasImage: HTMLImageElement,
  manifest: AtlasManifest,
  spriteId: string,
  atlasSize: number,
  x: number,
  y: number,
  scale: number = 1
): boolean {
  const sprite = manifest.sprites[spriteId];
  if (!sprite) {
    console.error(`Sprite not found in manifest: ${spriteId}`);
    return false;
  }

  const frame = sprite.frames[atlasSize];
  if (!frame) {
    console.error(`Frame not found for sprite ${spriteId} at size ${atlasSize}`);
    return false;
  }

  try {
    // Draw from atlas to canvas
    ctx.drawImage(
      atlasImage,
      frame.x, frame.y, frame.w, frame.h,  // Source rect
      x - (frame.w * scale) / 2,           // Dest x (centered)
      y - (frame.h * scale) / 2,           // Dest y (centered)
      frame.w * scale,                      // Dest width
      frame.h * scale                       // Dest height
    );
    return true;
  } catch (error) {
    console.error(`Failed to draw sprite ${spriteId}:`, error);
    return false;
  }
}

/**
 * Draw multiple sprites in a grid layout (for preview/demo)
 */
export function drawSpriteGrid(
  ctx: CanvasRenderingContext2D,
  atlasImage: HTMLImageElement,
  manifest: AtlasManifest,
  spriteIds: string[],
  atlasSize: number,
  startX: number,
  startY: number,
  spacing: number,
  scale: number = 1
): void {
  spriteIds.forEach((id, index) => {
    const x = startX + (index * spacing);
    drawSprite(ctx, atlasImage, manifest, id, atlasSize, x, startY, scale);
  });
}
