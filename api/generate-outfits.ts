import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runDecisionEngine } from '../src/lib/decisionEngine/index';
import type { FlowData } from '../src/types/praxis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const flowData = req.body as FlowData;
    if (!flowData?.occasion?.event) {
      return res.status(400).json({ error: 'flowData.occasion.event is required' });
    }
    const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
    const result = await runDecisionEngine(flowData, { geminiApiKey });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[generate-outfits]', err);
    return res.status(500).json({
      error: 'Decision engine failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
