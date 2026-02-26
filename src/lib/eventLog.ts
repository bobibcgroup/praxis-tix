/**
 * Event logging for analytics and retailer insight.
 * Logs: occasion types, vibe selections, drop-offs, chosen outfits.
 */

export type PraxisEventType =
  | 'flow_start'
  | 'occasion_selected'
  | 'context_selected'
  | 'preferences_selected'
  | 'outfits_requested'
  | 'outfit_selected'
  | 'try_on_started'
  | 'flow_completed'
  | 'flow_abandoned';

export interface PraxisEventPayload {
  event: PraxisEventType;
  timestamp: string;
  /** quick | personal */
  mode?: string;
  occasion?: string;
  location?: string;
  when?: string;
  setting?: string;
  budget?: string;
  priority?: string;
  outfitId?: number | string;
  outfitLabel?: string;
  /** For drop-off: step at which user left */
  step?: number;
}

const LOG_KEY = 'praxis_events';

function getStoredEvents(): PraxisEventPayload[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(events: PraxisEventPayload[]) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(events.slice(-500)));
  } catch {
    // ignore
  }
}

export function logEvent(payload: Omit<PraxisEventPayload, 'timestamp'>): void {
  const event: PraxisEventPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };
  const events = getStoredEvents();
  events.push(event);
  persist(events);
}

export function getEvents(): PraxisEventPayload[] {
  return getStoredEvents();
}

export function clearEvents(): void {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    // ignore
  }
}
