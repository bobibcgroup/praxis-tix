import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSession } from '../../../src/lib/biometricSessionStore';

/** POST /api/biometrics/session/start — Start a biometrics capture session. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = (req.body || {}) as { user_id?: string; flow?: 'occasion' | 'dna' };
    const user_id = body.user_id ?? 'anonymous';
    const flow = body.flow === 'dna' ? 'dna' : 'occasion';
    const session = createSession(user_id, flow);
    return res.status(200).json({
      session_id: session.session_id,
      user_id: session.user_id,
      flow: session.flow,
      face_status: session.face_status,
      body_status: session.body_status,
      created_at: session.created_at,
    });
  } catch (err) {
    console.error('[biometrics/session/start]', err);
    return res.status(500).json({
      error: 'Failed to start session',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
