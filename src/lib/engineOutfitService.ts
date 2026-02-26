/**
 * Primary path: Decision Engine → Trend API.
 * 1) GET outfit recommendations from engine (reasoning + confidence)
 * 2) Generate trend-based images for those outfits
 */

import type { FlowData, Outfit } from '@/types/praxis';
import type { GenerateOutfitsResponse } from '@/types/decisionEngine';
import { getValidOutfits, getTierLabel } from '@/lib/outfitLibrary';
import { generateTrendOutfits, mergeTrendImagesIntoOutfits } from '@/lib/trendOutfitService';

const API_BASE =
  typeof window !== 'undefined' ? (import.meta.env.VITE_API_BASE ?? '') : '';
const GENERATE_OUTFITS_URL = `${API_BASE || ''}/api/generate-outfits`;

export interface EnginePlusTrendResult {
  outfits: Outfit[];
  thinkingSteps: string[];
}

/**
 * Runs Decision Engine then Trend API. Returns outfits with reasoning, confidence, and trend-generated images.
 */
export async function getOutfitsWithTrend(
  flowData: FlowData
): Promise<EnginePlusTrendResult> {
  const res = await fetch(GENERATE_OUTFITS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flowData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || `Engine failed: ${res.status}`);
  }
  const engineResult: GenerateOutfitsResponse = await res.json();
  if (!engineResult.success || !engineResult.outfits?.length) {
    throw new Error('No outfits returned from engine');
  }

  const validOutfits = getValidOutfits();
  const outfitsFromEngine: Outfit[] = engineResult.outfits.map((o) => {
    const entry = validOutfits.find((e) => e.id === o.outfitId);
    const label = o.label;
    const title = entry?.title ?? 'Curated look';
    const items = entry?.items ?? { top: '', bottom: '', shoes: '' };
    const reason = o.reasoning?.summary ?? entry?.reason ?? '';
    return {
      id: o.id,
      title,
      label,
      items,
      reason,
      imageUrl: entry?.image_url ?? '',
      reasoning: o.reasoning,
      confidence: o.confidence,
      score_breakdown: o.score_breakdown,
    };
  });

  const trendResult = await generateTrendOutfits(flowData, outfitsFromEngine);
  const outfitsWithImages = mergeTrendImagesIntoOutfits(outfitsFromEngine, trendResult);

  return {
    outfits: outfitsWithImages,
    thinkingSteps: engineResult.thinkingSteps ?? [],
  };
}
