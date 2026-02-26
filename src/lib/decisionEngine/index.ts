/**
 * Decision Engine: runs intent → mapping → reasoning.
 * When geminiApiKey is provided, uses AI for intent classification and explanation generation.
 */

import type { FlowData } from '@/types/praxis';
import type { GenerateOutfitsResponse, EngineOutfitResult } from '@/types/decisionEngine';
import type { MappingResult } from './mappingEngine';
import { flowDataToIntent } from './intentBuilder';
import { classifyIntentWithAI } from './aiIntentClassifier';
import { mapIntentToOutfitIds } from './mappingEngine';
import { generateReasoning } from './reasoningEngine';
import { generateExplanationWithAI } from './aiExplanationGenerator';
import { getValidOutfits, getTierLabel } from '@/lib/outfitLibrary';
import type { OutfitLabel } from '@/types/praxis';

const THINKING_STEPS = [
  'Analyzing event context…',
  'Balancing formality and comfort…',
  'Selecting optimal silhouettes…',
];

function compositeConfidence(m: MappingResult): number {
  const b = m.score_breakdown;
  if (!b) return 70 + m.score / 4;
  const v =
    (b.body_harmony ?? 0.75) * 0.25 +
    (b.color_harmony ?? 0.8) * 0.2 +
    (b.event_appropriateness ?? 0.8) * 0.2 +
    (b.psychological_projection ?? 0.75) * 0.15 +
    (b.weather_compatibility ?? 0.8) * 0.1 +
    (b.user_preference_match ?? 0.8) * 0.1;
  return v * 100;
}

export interface RunDecisionEngineOptions {
  geminiApiKey?: string;
}

export async function runDecisionEngine(
  flowData: FlowData,
  options?: RunDecisionEngineOptions
): Promise<GenerateOutfitsResponse> {
  let intent = flowDataToIntent(flowData);
  if (options?.geminiApiKey) {
    const aiIntent = await classifyIntentWithAI(flowData, options.geminiApiKey);
    if (aiIntent) intent = aiIntent;
  }

  const mappingResults = mapIntentToOutfitIds(intent);
  const validOutfits = getValidOutfits();

  const outfits: EngineOutfitResult[] = [];
  let id = 1;
  for (const m of mappingResults) {
    const entry = validOutfits.find((o) => o.id === m.outfitId);
    if (!entry) continue;

    let reasoning: import('@/types/decisionEngine').ReasoningExplanation;
    if (options?.geminiApiKey) {
      const aiReasoning = await generateExplanationWithAI(
        intent,
        m.abstract,
        m.tier,
        entry.title,
        options.geminiApiKey
      );
      reasoning = aiReasoning ?? generateReasoning(intent, m.abstract, m.tier);
    } else {
      reasoning = generateReasoning(intent, m.abstract, m.tier);
    }

    const label = getTierLabel(entry.tier) as OutfitLabel;
    outfits.push({
      outfitId: m.outfitId,
      id: id++,
      label,
      reasoning,
      confidence: Math.min(98, Math.round(compositeConfidence(m))),
      abstract: m.abstract,
      score_breakdown: m.score_breakdown,
      retailer_ids: m.retailer_ids?.length ? m.retailer_ids : undefined,
    });
  }

  return {
    success: true,
    intent,
    outfits,
    thinkingSteps: THINKING_STEPS,
  };
}
