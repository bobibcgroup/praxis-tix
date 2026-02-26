/**
 * Fetches trend-based outfit images for the Style a Moment flow.
 * Sends flow data + outfit concepts to the API; returns outfits with generated imageUrls.
 */

import type { FlowData, Outfit } from '@/types/praxis';

const API_BASE =
  typeof window !== 'undefined'
    ? (import.meta.env.VITE_API_BASE ?? '')
    : '';
const TREND_OUTFITS_URL = `${API_BASE || ''}/api/generate-trend-outfits`;

export interface GenerateTrendOutfitsResult {
  success: boolean;
  trendSummary?: string;
  outfits: { id: number; imageUrl: string }[];
}

export async function generateTrendOutfits(
  flowData: FlowData,
  outfits: Outfit[]
): Promise<GenerateTrendOutfitsResult> {
  const concepts = outfits.map(({ id, title, label, items, reason }) => ({
    id,
    title,
    label,
    items,
    reason,
  }));

  const res = await fetch(TREND_OUTFITS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ flowData, outfits: concepts }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Merges API result image URLs into the existing outfit list (by id).
 */
export function mergeTrendImagesIntoOutfits(
  outfits: Outfit[],
  result: GenerateTrendOutfitsResult
): Outfit[] {
  if (!result.outfits?.length) return outfits;
  const byId = new Map(result.outfits.map((o) => [o.id, o.imageUrl]));
  return outfits.map((o) =>
    byId.has(o.id) ? { ...o, imageUrl: byId.get(o.id)! } : o
  );
}
