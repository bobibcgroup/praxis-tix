import { describe, it, expect } from 'vitest';
import {
  identityCoreFromBiometrics,
  mergeBiometricsIntoStyleDNA,
  BIOMETRIC_CONFIDENCE_THRESHOLD,
} from '@/lib/biometricStyleDnaIntegration';
import type { FaceProfile, BodyProfile, StyleDNA } from '@/types/praxis';

describe('biometricStyleDnaIntegration', () => {
  it('identityCoreFromBiometrics sets provisional when confidence below threshold', () => {
    const face: FaceProfile = {
      status: 'ok',
      confidence: 0.5,
      color_season: 'Deep Winter',
      quality_gates: { passed: true, notes: [] },
    };
    const body: BodyProfile = {
      status: 'ok',
      confidence: 0.8,
      kibbe_cluster: { Natural: 0.78, Classic: 0.22 },
      quality_gates: { passed: true, notes: [] },
    };
    const core = identityCoreFromBiometrics(face, body);
    expect(core.provisional).toBe(true);
    expect(core.color_season).toBeUndefined();
    expect(core.kibbe).toEqual({ Natural: 0.78, Classic: 0.22 });
    expect(core.assessed_date).toBeDefined();
  });

  it('identityCoreFromBiometrics does not set provisional when both above threshold', () => {
    const face: FaceProfile = {
      status: 'ok',
      confidence: 0.82,
      color_season: 'Deep Winter',
      quality_gates: { passed: true, notes: [] },
    };
    const body: BodyProfile = {
      status: 'ok',
      confidence: 0.79,
      kibbe_cluster: { Natural: 0.78, Classic: 0.22 },
      quality_gates: { passed: true, notes: [] },
    };
    const core = identityCoreFromBiometrics(face, body);
    expect(core.provisional).toBeFalsy();
    expect(core.color_season).toBe('Deep Winter');
    expect(core.kibbe).toEqual({ Natural: 0.78, Classic: 0.22 });
  });

  it('mergeBiometricsIntoStyleDNA adds identity_core to existing Style DNA', () => {
    const existing: StyleDNA = {
      primaryStyle: 'SMART_CASUAL',
      secondaryStyle: 'MODERN_MINIMAL',
      confidence: 'high',
    };
    const face: FaceProfile = {
      status: 'ok',
      confidence: 0.82,
      color_season: 'Soft Summer',
      quality_gates: { passed: true, notes: [] },
    };
    const body: BodyProfile = {
      status: 'ok',
      confidence: 0.79,
      kibbe_cluster: { Classic: 0.9, Dramatic: 0.1 },
      quality_gates: { passed: true, notes: [] },
    };
    const merged = mergeBiometricsIntoStyleDNA(existing, face, body);
    expect(merged.primaryStyle).toBe('SMART_CASUAL');
    expect(merged.identity_core?.color_season).toBe('Soft Summer');
    expect(merged.identity_core?.kibbe).toEqual({ Classic: 0.9, Dramatic: 0.1 });
  });

  it('BIOMETRIC_CONFIDENCE_THRESHOLD is 0.7', () => {
    expect(BIOMETRIC_CONFIDENCE_THRESHOLD).toBe(0.7);
  });
});
