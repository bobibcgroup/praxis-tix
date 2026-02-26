/**
 * Builds structured Intent from flow inputs (occasion, context, preferences).
 * Used by backend and by frontend when calling generate-outfits.
 */

import type { FlowData } from '@/types/praxis';
import type { IntentProfile, FormalityLevel, TemperatureContext, VibeType, RiskAppetite } from '@/types/decisionEngine';

const OCCASION_FORMALITY: Record<string, FormalityLevel> = {
  WEDDING: 'high',
  WORK: 'high',
  DINNER: 'high',
  DATE: 'medium',
  PARTY: 'medium',
};

const PRIORITY_VIBE: Record<string, VibeType> = {
  SHARP: 'sharp',
  COMFORT: 'comfort',
  IMPRESSION: 'sharp',
  SIMPLE: 'relaxed',
};

const WHEN_TEMP: Record<string, TemperatureContext> = {
  DAY: 'mild',
  NIGHT: 'mild',
};

/** Map flow data to structured Intent for the Decision Engine */
export function flowDataToIntent(flowData: FlowData): IntentProfile {
  const { occasion, context, preferences } = flowData;
  const event = (occasion?.event || '').toUpperCase();
  const location = context?.location || '';
  const when = context?.when || '';
  const setting = context?.setting || '';
  const budget = preferences?.budget || '';
  const priority = (preferences?.priority || '').toUpperCase();

  const formality = OCCASION_FORMALITY[event] ?? 'medium';
  const vibe = PRIORITY_VIBE[priority] ?? 'classic';
  const temperature = WHEN_TEMP[when] ?? 'mild';
  const risk: RiskAppetite = priority === 'SHARP' ? 'medium' : priority === 'COMFORT' ? 'low' : 'low';

  return {
    domain: 'advisory',
    occasion: event || 'unspecified',
    formality,
    temperature,
    vibe,
    risk,
    location: location || undefined,
    when: when || undefined,
    setting: setting || undefined,
    budget: budget || undefined,
    priority: priority || undefined,
    constraints: setting === 'OUTDOOR' ? ['heat_management'] : undefined,
  };
}
