import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { FeedbackPayload } from '../src/types/evaluation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const payload = req.body as FeedbackPayload;
    const event = payload?.event;
    const validEvents = ['outfit_shown', 'outfit_accepted', 'outfit_rejected', 'flow_abandoned'];
    if (!event || !validEvents.includes(event)) {
      return res.status(400).json({ error: 'event is required and must be one of: ' + validEvents.join(', ') });
    }
    // Persist: in production wire to Supabase or analytics backend
    console.info('[log-feedback]', JSON.stringify({ ...payload, receivedAt: new Date().toISOString() }));
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[log-feedback]', err);
    return res.status(500).json({
      error: 'Feedback logging failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
