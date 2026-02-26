import { describe, it, expect } from 'vitest';
import {
  applyStyleDNAWithDrift,
  styleDNASignalHash,
  hasThreeConsistentSignals,
  pushPendingStyleDNASignal,
  clearPendingStyleDNASignals,
} from '@/lib/styleDnaDrift';

describe('styleDnaDrift', () => {
  it('applyStyleDNAWithDrift sets version 1 and updatedAt when no existing', () => {
    const proposed = { primaryStyle: 'classic', confidence: 'high' as const };
    const result = applyStyleDNAWithDrift(proposed, null);
    expect(result.version).toBe(1);
    expect(result.updatedAt).toBeDefined();
    expect(result.primaryStyle).toBe('classic');
  });

  it('applyStyleDNAWithDrift increments version when existing', () => {
    const proposed = { primaryStyle: 'relaxed', confidence: 'medium' as const };
    const existing = { ...proposed, version: 2, updatedAt: '2025-01-01T00:00:00Z' };
    const result = applyStyleDNAWithDrift(proposed, existing);
    expect(result.version).toBe(3);
    expect(result.updatedAt).toBeDefined();
  });

  it('styleDNASignalHash is stable for same inputs', () => {
    const dna = { primaryStyle: 'classic', secondaryStyle: 'minimal', confidence: 'high' as const };
    expect(styleDNASignalHash(dna)).toBe(styleDNASignalHash(dna));
    expect(styleDNASignalHash(dna)).toContain('classic');
  });

  it('hasThreeConsistentSignals is true when 2 pending match current', () => {
    const userId = 'test-user-3signals';
    clearPendingStyleDNASignals(userId);
    const hash = 'classic||high';
    pushPendingStyleDNASignal(userId, hash);
    pushPendingStyleDNASignal(userId, hash);
    expect(hasThreeConsistentSignals(userId, hash)).toBe(true);
    expect(hasThreeConsistentSignals(userId, 'other')).toBe(false);
    clearPendingStyleDNASignals(userId);
  });
});
