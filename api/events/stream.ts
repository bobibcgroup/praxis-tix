import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession } from '../src/lib/biometricSessionStore';

function sendSSE(res: VercelResponse, event: string, data: object): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export const config = {
  api: { responseLimit: false },
};

/**
 * GET /api/events/stream?session_id=... — SSE stream for progressive reasoning UI.
 * Used during Style DNA build to show "Extracting color signals…", "Clustering body lines…", etc.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session_id = typeof req.query?.session_id === 'string' ? req.query.session_id : undefined;

  try {
    const steps = [
      'Extracting color signals…',
      'Running quality checks…',
      'Computing season confidence…',
      'Measuring shoulder geometry…',
      'Clustering body lines…',
      'Generating your Style DNA…',
    ];
    for (const message of steps) {
      sendSSE(res, 'reasoning_step', { message });
    }
    if (session_id) {
      const session = getSession(session_id);
      sendSSE(res, 'biometrics_status', {
        face_status: session?.face_status ?? 'missing',
        body_status: session?.body_status ?? 'missing',
      });
    }
    sendSSE(res, 'done', { success: true });
    res.end();
  } catch (err) {
    console.error('[events/stream]', err);
    sendSSE(res, 'error', {
      error: 'Stream failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
    res.end();
  }
}
