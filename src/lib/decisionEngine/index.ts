/**
 * Decision Engine: runs intent → mapping → reasoning.
 * When geminiApiKey is provided, uses AI for intent classification and explanation generation.
 */

import type { FlowData } from '@/types/praxis';
import type { GenerateOutfitsResponse, EngineOutfitResult } from '@/types/decisionEngine';
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
      confidence: Math.min(98, 70 + m.score / 4),
      abstract: m.abstract,
    });
  }

  return {
    success: true,
    intent,
    outfits,
    thinkingSteps: THINKING_STEPS,
  };
}
