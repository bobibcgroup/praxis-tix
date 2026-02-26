/**
 * Fetches AI-generated Style DNA copy (identity phrase, palette, lean into, avoid, closing).
 */

export interface StyleDNAResponse {
  success: boolean;
  fallback?: boolean;
  identityPhrase: string;
  paletteReasoning: string;
  leanInto: string[];
  avoid: string[];
  closingLine: string;
}

const API_BASE = typeof window !== 'undefined' ? (import.meta.env.VITE_API_BASE ?? '') : '';
const STYLE_DNA_URL = `${API_BASE || ''}/api/generate-style-dna`;

export async function generateStyleDNACopy(params: {
  lifestyle?: string;
  inspirationPreset?: string;
  skinToneBucket?: string;
  contrastLevel?: string;
}): Promise<StyleDNAResponse> {
  const res = await fetch(STYLE_DNA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Style DNA failed: ${res.status}`);
  return res.json();
}
