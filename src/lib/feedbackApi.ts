/**
 * Client for /api/log-feedback. Sends outfit_accepted / outfit_rejected for thumbs up/down.
 */

import type { FeedbackPayload } from '@/types/evaluation';

const API_BASE = typeof window !== 'undefined' ? (import.meta.env.VITE_API_BASE ?? '') : '';
const FEEDBACK_URL = `${API_BASE || ''}/api/log-feedback`;

export async function logFeedback(payload: FeedbackPayload): Promise<void> {
  await fetch(FEEDBACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
