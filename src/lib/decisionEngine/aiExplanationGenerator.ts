/**
 * AI Explanation generator: Gemini produces reasoning text from intent + outfit attributes.
 */

import type { IntentProfile, ReasoningExplanation, AbstractOutfitAttributes } from '@/types/decisionEngine';

function buildPrompt(
  intent: IntentProfile,
  abstract: AbstractOutfitAttributes,
  tier: string,
  outfitTitle: string
): string {
  return `You are a men's style expert. In 1-2 short sentences each, explain why this outfit works for the user's moment.

User moment: occasion=${intent.occasion}, location=${intent.location}, time=${intent.when}, vibe=${intent.vibe}, formality=${intent.formality}.
Outfit: "${outfitTitle}". Attributes: formality=${abstract.formality}, silhouette=${abstract.silhouette}, palette=${abstract.palette}, vibe=${abstract.vibe}. Tier: ${tier}.

Respond with ONLY a JSON object (no markdown):
{"summary":"One sentence overall why this look works.","silhouette":"One sentence on silhouette.","color_logic":"One sentence on color.","context_logic":"One sentence on occasion/context."}`;
}

export async function generateExplanationWithAI(
  intent: IntentProfile,
  abstract: AbstractOutfitAttributes,
  tier: 'SAFEST' | 'SHARPER' | 'RELAXED',
  outfitTitle: string,
  apiKey: string
): Promise<ReasoningExplanation | null> {
  const prompt = buildPrompt(intent, abstract, tier, outfitTitle);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text) as Record<string, string>;
    return {
      summary: parsed.summary ?? '',
      silhouette: parsed.silhouette,
      color_logic: parsed.color_logic,
      context_logic: parsed.context_logic,
    };
  } catch {
    return null;
  }
}
