import { AtlasManifest } from './types';

/**
 * Pick the best sprite ID based on tag overlap scoring
 * Returns sprite with most matching tags, or first sprite as fallback
 */
export function pickSpriteId(
  manifest: AtlasManifest,
  requiredTags: string[]
): string | null {
  if (!requiredTags || requiredTags.length === 0) {
    // No tags provided, return first available sprite
    const keys = Object.keys(manifest.sprites);
    return keys.length > 0 ? keys[0] : null;
  }

  // Score sprites by tag overlap
  const scores = new Map<string, number>();

  for (const tag of requiredTags) {
    const spriteIds = manifest.tagIndex[tag.toLowerCase()] || [];
    for (const id of spriteIds) {
      scores.set(id, (scores.get(id) || 0) + 1);
    }
  }

  // Return sprite with highest score
  let bestId: string | null = null;
  let bestScore = -1;

  for (const [id, score] of scores.entries()) {
    if (score > bestScore) {
      bestId = id;
      bestScore = score;
    }
  }

  // Fallback to first sprite if no matches
  if (!bestId) {
    const keys = Object.keys(manifest.sprites);
    bestId = keys.length > 0 ? keys[0] : null;
    if (bestId) {
      console.warn(`No tag matches for [${requiredTags.join(', ')}], using fallback: ${bestId}`);
    }
  }

  return bestId;
}

/**
 * Pick multiple sprite IDs for a set of bubble definitions
 * Ensures variety by avoiding duplicate picks when possible
 */
export function pickMultipleSprites(
  manifest: AtlasManifest,
  tagSets: string[][]
): string[] {
  const picked: string[] = [];
  const used = new Set<string>();

  for (const tags of tagSets) {
    const id = pickSpriteId(manifest, tags);
    if (id) {
      // Try to avoid duplicates
      if (used.has(id) && Object.keys(manifest.sprites).length > tagSets.length) {
        // Find alternative with same tags
        const alternatives = tags
          .flatMap(t => manifest.tagIndex[t.toLowerCase()] || [])
          .filter(altId => !used.has(altId));
        
        if (alternatives.length > 0) {
          const altId = alternatives[0];
          picked.push(altId);
          used.add(altId);
          continue;
        }
      }
      
      picked.push(id);
      used.add(id);
    }
  }

  return picked;
}
