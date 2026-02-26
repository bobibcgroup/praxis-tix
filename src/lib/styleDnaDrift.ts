/**
 * Style DNA drift rule: versioning and optional update guardrails.
 * - Version: increment when Style DNA is updated.
 * - 3 consistent signals: callers should only persist after 3 agreeing suggestions (e.g. store last 2 in localStorage and compare).
 * - Weekly drift cap: optional ±0.05/week on scalar fields when we extend schema with aesthetic_vectors.
 */

import type { StyleDNA } from '@/types/praxis';

const DRIFT_CAP_PER_WEEK = 0.05;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export interface StyleDNAWithMeta extends StyleDNA {
  version?: number;
  updatedAt?: string;
}

/**
 * Merges proposed Style DNA with existing, applying version increment and optional drift cap.
 * If existing is null/undefined, returns proposed with version 1 and updatedAt.
 * Otherwise increments version and sets updatedAt; future: clamp scalar drift to ±0.05/week.
 */
export function applyStyleDNAWithDrift(
  proposed: StyleDNA,
  existing: StyleDNAWithMeta | null | undefined
): StyleDNAWithMeta {
  const now = new Date().toISOString();
  if (!existing) {
    return {
      ...proposed,
      version: 1,
      updatedAt: now,
    };
  }
  const version = (existing.version ?? 1) + 1;
  const updatedAt = now;
  // When Style DNA gets scalar fields (e.g. aesthetic_vectors), apply drift cap here:
  // const weeksSince = (Date.now() - new Date(existing.updatedAt || 0).getTime()) / MS_PER_WEEK;
  // const maxDrift = weeksSince * DRIFT_CAP_PER_WEEK;
  return {
    ...proposed,
    version,
    updatedAt,
  };
}

/**
 * Caller hook: require 3 consistent signals before persisting.
 * Store last N (e.g. 2) proposed Style DNA hashes in localStorage; only persist when current matches both.
 */
const PENDING_SIGNALS_KEY = 'praxis_style_dna_pending';

export function getPendingStyleDNASignals(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${PENDING_SIGNALS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushPendingStyleDNASignal(userId: string, styleDNAHash: string, maxSignals = 2): string[] {
  const pending = getPendingStyleDNASignals(userId);
  const next = [...pending, styleDNAHash].slice(-maxSignals);
  try {
    localStorage.setItem(`${PENDING_SIGNALS_KEY}_${userId}`, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearPendingStyleDNASignals(userId: string): void {
  try {
    localStorage.removeItem(`${PENDING_SIGNALS_KEY}_${userId}`);
  } catch {
    // ignore
  }
}

/** Simple hash for "3 consistent signals" comparison (primaryStyle + secondaryStyle + confidence). */
export function styleDNASignalHash(dna: StyleDNA): string {
  return [dna.primaryStyle, dna.secondaryStyle ?? '', dna.confidence].join('|');
}

/** Returns true when we have 3 consistent signals (current hash matches 2 pending). */
export function hasThreeConsistentSignals(userId: string, currentHash: string): boolean {
  const pending = getPendingStyleDNASignals(userId);
  return pending.length >= 2 && pending.every((h) => h === currentHash);
}
