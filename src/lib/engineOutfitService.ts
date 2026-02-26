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

// #region agent log
const DEBUG_LOG = (payload: Record<string, unknown>) => {
  fetch('http://127.0.0.1:7523/ingest/cd5b1cd2-f021-4085-ace2-0568b7026af3', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '5a3013' }, body: JSON.stringify({ sessionId: '5a3013', ...payload, timestamp: Date.now() }) }).catch(() => {});
};
// #endregion

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
  // #region agent log
  DEBUG_LOG({ location: 'engineOutfitService.ts:getOutfitsWithTrend:beforeFetch', message: 'generate-outfits request', data: { url: GENERATE_OUTFITS_URL, occasionEvent: flowData?.occasion?.event, hasContext: !!flowData?.context, hasPreferences: !!flowData?.preferences }, hypothesisId: 'H2,H3' });
  // #endregion
  const res = await fetch(GENERATE_OUTFITS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flowData),
  });
  if (!res.ok) {
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { _raw: text.slice(0, 500) };
    }
    // #region agent log
    DEBUG_LOG({ location: 'engineOutfitService.ts:getOutfitsWithTrend:resNotOk', message: 'generate-outfits error response', data: { status: res.status, statusText: res.statusText, bodyError: data?.error, bodyMessage: data?.message, bodyRaw: data._raw }, hypothesisId: 'H1,H4' });
    // #endregion
    throw new Error(data?.message as string || data?.error as string || `Engine failed: ${res.status}`);
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
