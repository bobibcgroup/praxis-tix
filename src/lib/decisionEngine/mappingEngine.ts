/**
 * Maps Intent to 3 outfit library ids (SAFEST, SHARPER, RELAXED).
 * Uses metadata to score and select; returns score_breakdown (Chain-of-Style) and retailer_ids.
 */

import type { IntentProfile, AbstractOutfitAttributes, ScoreBreakdown } from '@/types/decisionEngine';
import { getValidOutfits } from '@/lib/outfitLibrary';
import { getOutfitMetadata } from '@/lib/outfitMetadata';
import type { OccasionType } from '@/types/praxis';

export interface MappingResult {
  outfitId: string;
  tier: 'SAFEST' | 'SHARPER' | 'RELAXED';
  abstract: AbstractOutfitAttributes;
  score: number;
  score_breakdown: ScoreBreakdown;
  retailer_ids: string[];
}

/** Weighted formula: body 0.25, color 0.20, event 0.20, psychological 0.15, weather 0.10, preference 0.10 */
function computeScoreBreakdown(
  intent: IntentProfile,
  abstract: AbstractOutfitAttributes,
  tier: string
): ScoreBreakdown {
  const event_appropriateness = intent.formality === abstract.formality ? 0.95 : intent.formality === 'medium' && abstract.formality !== 'low' ? 0.8 : 0.6;
  const user_preference_match = intent.vibe === abstract.vibe ? 0.95 : 0.7;
  const psychological_projection = intent.psychological_goal ? 0.85 : 0.75;
  const color_harmony = 0.8;
  const body_harmony = 0.75;
  const weather_compatibility = intent.temperature === abstract.fabric_weight ? 0.9 : 0.8;
  return {
    event_appropriateness,
    user_preference_match,
    psychological_projection,
    color_harmony,
    body_harmony,
    weather_compatibility,
  };
}

function compositeScore(breakdown: ScoreBreakdown): number {
  const b = breakdown.body_harmony ?? 0.75;
  const c = breakdown.color_harmony ?? 0.8;
  const e = breakdown.event_appropriateness ?? 0.8;
  const p = breakdown.psychological_projection ?? 0.75;
  const w = breakdown.weather_compatibility ?? 0.8;
  const u = breakdown.user_preference_match ?? 0.8;
  return b * 0.25 + c * 0.2 + e * 0.2 + p * 0.15 + w * 0.1 + u * 0.1;
}

/**
 * Returns 3 outfit ids (one per tier) that best match the intent.
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
    const scored = candidates.map(({ entry, meta }) => {
      const scoreBreakdown = computeScoreBreakdown(intent, meta.abstract, tier);
      const score = compositeScore(scoreBreakdown) * 100;
      const retailer_ids = meta.retailer_ids ?? [
        meta.modular_parts?.top?.retailer_id,
        meta.modular_parts?.bottom?.retailer_id,
        meta.modular_parts?.shoes?.retailer_id,
      ].filter(Boolean) as string[];
      return {
        outfitId: entry.id,
        tier,
        abstract: meta.abstract,
        score,
        score_breakdown: scoreBreakdown,
        retailer_ids,
      };
    });
    scored.sort((a, b) => b.score - a.score);
    results.push(scored[0]);
  }
  return results;
}
