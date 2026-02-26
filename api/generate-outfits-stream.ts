import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runDecisionEngine } from '../src/lib/decisionEngine';
import type { FlowData } from '../src/types/praxis';
import type { GenerateOutfitsResponse } from '../src/types/decisionEngine';

function sendSSE(res: VercelResponse, event: string, data: object): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export const config = {
  api: { responseLimit: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const flowData = req.body as FlowData;
    if (!flowData?.occasion?.event) {
      return res.status(400).json({ error: 'flowData.occasion.event is required' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
    sendSSE(res, 'reasoning_step', { message: 'Analyzing event context…' });
    sendSSE(res, 'reasoning_step', { message: 'Balancing formality and comfort…' });

    const result = await runDecisionEngine(flowData, { geminiApiKey });

    sendSSE(res, 'intent_classified', { intent: result.intent });
    sendSSE(res, 'reasoning_step', { message: 'Selecting optimal silhouettes…' });
    sendSSE(res, 'analysis_complete', {});

    result.outfits.forEach((outfit, i) => {
      sendSSE(res, `outfit_${i + 1}`, outfit);
    });

    sendSSE(res, 'done', {
      success: true,
      intent: result.intent,
      outfits: result.outfits,
      thinkingSteps: result.thinkingSteps,
    } as GenerateOutfitsResponse);

    res.end();
  } catch (err) {
    console.error('[generate-outfits-stream]', err);
    sendSSE(res, 'error', {
      error: 'Decision engine failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
    res.end();
  }
}
