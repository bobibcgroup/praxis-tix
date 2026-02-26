import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 120,
};

// Minimal types for request body (no dependency on src)
interface FlowDataBody {
  occasion?: { event?: string };
  context?: { location?: string; when?: string; setting?: string };
  preferences?: { budget?: string; priority?: string };
}

interface OutfitConcept {
  id: number;
  title: string;
  label: string;
  items: { top: string; bottom: string; shoes: string; extras?: string };
  reason: string;
}

const TREND_PROMPT = `You are a men's fashion expert. Given the following outfit moment, describe current trends that fit this context in 2-4 short, concrete sentences. Focus on: silhouettes, colors, fabrics, and vibe that suit this occasion, location, and time. Be specific and visual so an image model can illustrate the look. Output only the trend description, no preamble.

Context:
- Occasion: {{occasion}}
- Location: {{location}}
- Time: {{time}}
- Setting: {{setting}}
- Budget vibe: {{budget}}
- Priority: {{priority}}

Trend description:`;

function buildTrendPrompt(flowData: FlowDataBody): string {
  const occasion = flowData?.occasion?.event ?? 'unspecified';
  const location = flowData?.context?.location ?? 'unspecified';
  const when = flowData?.context?.when ?? 'unspecified';
  const setting = flowData?.context?.setting ?? 'unspecified';
  const budget = flowData?.preferences?.budget ?? 'unspecified';
  const priority = flowData?.preferences?.priority ?? 'unspecified';
  return TREND_PROMPT
    .replace('{{occasion}}', occasion)
    .replace('{{location}}', location)
    .replace('{{time}}', when)
    .replace('{{setting}}', setting)
    .replace('{{budget}}', budget)
    .replace('{{priority}}', priority);
}

async function researchTrends(flowData: FlowDataBody, apiKey: string): Promise<string> {
  const prompt = buildTrendPrompt(flowData);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 256, temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Trend research failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== 'string') throw new Error('Trend research returned no text');
  return text.trim();
}

function buildImagePrompt(trendSummary: string, outfit: OutfitConcept, occasion: string, when: string): string {
  const { title, items, label } = outfit;
  return `Professional fashion photograph of a single male model, full body, neutral background. Outfit: ${title}. 
Top: ${items.top}. Bottom: ${items.bottom}. Shoes: ${items.shoes}. 
Style: ${label}. Occasion: ${occasion}. Time: ${when}.
Apply these current trends: ${trendSummary}
Photorealistic, well-lit, editorial style. No text or logos.`;
}

async function generateOutfitImage(
  prompt: string,
  apiKey: string
): Promise<string> {
  // Gemini 2.5 Flash Image (Nano Banana) - use GEMINI_IMAGE_MODEL env to override
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          responseMimeType: 'text/plain',
          imageConfig: { aspectRatio: '3:4', imageSize: '1K' },
        },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Image generation failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || 'image/png';
      return `data:${mime};base64,${part.inlineData.data}`;
    }
  }
  throw new Error('Image generation returned no image');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Gemini API key not configured',
      message: 'Set GEMINI_API_KEY (or VITE_GEMINI_API_KEY) in Vercel environment variables',
    });
  }

  try {
    const { flowData, outfits } = req.body as { flowData?: FlowDataBody; outfits?: OutfitConcept[] };
    if (!flowData || !Array.isArray(outfits) || outfits.length === 0) {
      return res.status(400).json({ error: 'flowData and outfits (array) are required' });
    }

    const occasion = flowData.occasion?.event ?? '';
    const when = flowData.context?.when ?? '';

    const trendSummary = await researchTrends(flowData, apiKey);

    const results: { id: number; imageUrl: string }[] = [];
    for (const outfit of outfits) {
      const prompt = buildImagePrompt(trendSummary, outfit, occasion, when);
      const imageUrl = await generateOutfitImage(prompt, apiKey);
      results.push({ id: outfit.id, imageUrl });
    }

    return res.status(200).json({ success: true, trendSummary, outfits: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[generate-trend-outfits]', err);
    return res.status(500).json({ error: 'Generation failed', message });
  }
}
