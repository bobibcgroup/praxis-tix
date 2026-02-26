import { describe, it, expect } from 'vitest';
import { checkImageQuality, getImageQualityMessage } from '@/lib/imageQualityGate';

describe('imageQualityGate', () => {
  it('checkImageQuality returns ok: false and reason by default (stub)', () => {
    const result = checkImageQuality('https://example.com/photo.jpg');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('insufficient_resolution');
    expect(result.message).toBeDefined();
    expect(result.minResolution).toEqual({ width: 200, height: 200 });
  });

  it('getImageQualityMessage returns message when not ok', () => {
    const result = checkImageQuality('');
    const msg = getImageQualityMessage(result);
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).toBeTruthy();
  });

  it('getImageQualityMessage returns empty string when ok', () => {
    const msg = getImageQualityMessage({ ok: true });
    expect(msg).toBe('');
  });

  it('getImageQualityMessage prefers instruction when present', () => {
    const result = {
      ok: false,
      reason: 'blur_detected' as const,
      message: 'Image is too blurry',
      instruction: 'Hold still, face fills frame, natural light, no filters.',
    };
    const msg = getImageQualityMessage(result);
    expect(msg).toBe(result.instruction);
  });
});
