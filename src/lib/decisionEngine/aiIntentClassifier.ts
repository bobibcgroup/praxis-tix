/**
 * AI Intent classifier: Gemini converts flow answers into structured Intent.
 */

import type { FlowData } from '@/types/praxis';
import type { IntentProfile } from '@/types/decisionEngine';

const PROMPT = `You are a men's style assistant. Convert the user's outfit moment choices into a structured intent.

User choices:
- Occasion: {{occasion}}
- Location: {{location}}
- Time: {{when}}
- Setting: {{setting}}
- Budget: {{budget}}
- Priority (vibe): {{priority}}

Respond with ONLY a JSON object (no markdown, no explanation) with these exact keys:
occasion (string, same as input), formality ("low"|"medium"|"high"), temperature ("cool"|"mild"|"hot"), vibe ("sharp"|"comfort"|"relaxed"|"classic"|"expressive"), risk ("low"|"medium"|"high"), location (string), when (string), setting (string), budget (string), priority (string), constraints (array of strings, optional, e.g. ["heat_management"] for outdoor).
Example: {"occasion":"DATE","formality":"medium","temperature":"mild","vibe":"sharp","risk":"low","location":"RESTAURANT","when":"NIGHT","setting":"INDOOR","budget":"MID_RANGE","priority":"SHARP","constraints":[]}`;

function buildPrompt(flowData: FlowData): string {
  const o = flowData?.occasion?.event ?? '';
  const loc = flowData?.context?.location ?? '';
  const when = flowData?.context?.when ?? '';
  const set = flowData?.context?.setting ?? '';
  const budget = flowData?.preferences?.budget ?? '';
  const priority = flowData?.preferences?.priority ?? '';
  return PROMPT
    .replace('{{occasion}}', o)
    .replace('{{location}}', loc)
    .replace('{{when}}', when)
    .replace('{{setting}}', set)
    .replace('{{budget}}', budget)
    .replace('{{priority}}', priority);
}

export async function classifyIntentWithAI(
  flowData: FlowData,
  apiKey: string
): Promise<IntentProfile | null> {
  const prompt = buildPrompt(flowData);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return {
      occasion: String(parsed.occasion || flowData.occasion?.event || ''),
      formality: (parsed.formality as IntentProfile['formality']) || 'medium',
      temperature: (parsed.temperature as IntentProfile['temperature']) || 'mild',
      vibe: (parsed.vibe as IntentProfile['vibe']) || 'classic',
      risk: (parsed.risk as IntentProfile['risk']) || 'low',
      location: parsed.location != null ? String(parsed.location) : undefined,
      when: parsed.when != null ? String(parsed.when) : undefined,
      setting: parsed.setting != null ? String(parsed.setting) : undefined,
      budget: parsed.budget != null ? String(parsed.budget) : undefined,
      priority: parsed.priority != null ? String(parsed.priority) : undefined,
      constraints: Array.isArray(parsed.constraints) ? (parsed.constraints as string[]) : undefined,
    };
  } catch {
    return null;
  }
}
