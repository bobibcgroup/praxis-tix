/**
 * Generates reasoning explanation strings from intent + outfit metadata.
 * No hardcoded copy; all text derived from logic/rules for perceived intelligence.
 */

import type { IntentProfile, ReasoningExplanation, AbstractOutfitAttributes } from '@/types/decisionEngine';

const SILHOUETTE_REASON: Record<string, string> = {
  structured: 'Structured silhouette keeps the look intentional and occasion-appropriate.',
  relaxed: 'Relaxed fit balances comfort with a put-together feel.',
  fitted: 'Fitted cut works for both indoor and outdoor settings.',
  oversized: 'Oversized elements add a modern, easy vibe.',
};

const VIBE_REASON: Record<string, string> = {
  sharp: 'Sharp choices signal confidence without trying too hard.',
  comfort: 'Comfort-first pieces you can wear all day.',
  relaxed: 'Relaxed options that still read polished.',
  classic: 'Classic pieces that always work.',
  expressive: 'Expressive details show personality while staying appropriate.',
};

export function generateReasoning(
  intent: IntentProfile,
  abstract: AbstractOutfitAttributes,
  tier: 'SAFEST' | 'SHARPER' | 'RELAXED'
): ReasoningExplanation {
  const silhouette = SILHOUETTE_REASON[abstract.silhouette] ?? 'This silhouette suits the occasion and setting.';
  const color_logic =
    abstract.palette === 'dark_neutrals'
      ? 'Dark neutrals read formal and versatile.'
      : abstract.palette === 'light_neutrals'
        ? 'Light neutrals keep the look fresh and approachable.'
        : 'The palette works for the time and setting you chose.';
  const context_logic =
    intent.setting === 'OUTDOOR'
      ? 'Chosen to maintain formality while reducing heat retention for outdoor conditions.'
      : intent.occasion === 'WORK'
        ? 'Balances professionalism with your preferred vibe.'
        : 'Fits the occasion, location, and time of day you selected.';

  const summary =
    tier === 'SAFEST'
      ? `A safe, confident look that feels natural for ${intent.occasion.toLowerCase()}. ${silhouette}`
      : tier === 'SHARPER'
        ? `More polished without overdoing it. ${silhouette} ${color_logic}`
        : `Comfort-first while still looking put together. ${silhouette}`;

  return {
    summary,
    silhouette,
    color_logic,
    context_logic,
  };
}
