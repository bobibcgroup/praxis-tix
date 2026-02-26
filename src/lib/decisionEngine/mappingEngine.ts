/**
 * Maps Intent to 3 outfit library ids (SAFEST, SHARPER, RELAXED).
 * Uses metadata to score and select; output stays deterministic for demo.
 */

import type { IntentProfile, AbstractOutfitAttributes } from '@/types/decisionEngine';
import { getValidOutfits } from '@/lib/outfitLibrary';
import { getOutfitMetadata } from '@/lib/outfitMetadata';
import type { OccasionType } from '@/types/praxis';

export interface MappingResult {
  outfitId: string;
  tier: 'SAFEST' | 'SHARPER' | 'RELAXED';
  abstract: AbstractOutfitAttributes;
  score: number;
}

/**
 * Returns 3 outfit ids (one per tier) that best match the intent.
 * Uses existing library filtering by occasion then scores by metadata.
 */
export function mapIntentToOutfitIds(intent: IntentProfile): MappingResult[] {
  const occasion = intent.occasion as OccasionType;
  if (!occasion) return [];

  const valid = getValidOutfits().filter((o) => o.occasion === occasion);
  const withMeta = valid
    .map((entry) => ({
      entry,
      meta: getOutfitMetadata(entry.id),
    }))
    .filter((x): x is typeof x & { meta: NonNullable<typeof x.meta> } => x.meta != null);

  const results: MappingResult[] = [];
  for (const tier of ['SAFEST', 'SHARPER', 'RELAXED'] as const) {
    const candidates = withMeta.filter((x) => x.entry.tier === tier);
    if (candidates.length === 0) continue;
    const scored = candidates.map(({ entry, meta }) => ({
      outfitId: entry.id,
      tier,
      abstract: meta.abstract,
      score: scoreMatch(intent, meta.abstract),
    }));
    scored.sort((a, b) => b.score - a.score);
    results.push(scored[0]);
  }
  return results;
}

function scoreMatch(intent: IntentProfile, abstract: AbstractOutfitAttributes): number {
  let s = 100;
  if (intent.formality !== abstract.formality) s -= 25;
  if (intent.vibe !== abstract.vibe) s -= 15;
  if (intent.risk === 'low' && abstract.tier !== 'SAFEST') s -= 10;
  if (intent.risk === 'medium' && abstract.tier !== 'SHARPER') s -= 5;
  return Math.max(0, s);
}
