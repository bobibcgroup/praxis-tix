/**
 * Server-side image quality gate using sharp.
 * Used by analyze-body and analyze-color APIs. Run only in Node (API routes).
 */

import type { ImageQualityResult } from './imageQualityGate';

const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;
const MIN_LAPLACIAN_VARIANCE = 100;
const MAX_CLIPPING_RATIO = 0.05;
const MAX_CHANNEL_CORRELATION = 0.9;

const REJECT_INSTRUCTIONS: Record<NonNullable<ImageQualityResult['reason']>, string> = {
  insufficient_resolution: 'Use a higher resolution photo. Face or body should fill the frame.',
  blur_detected: 'Hold still, face fills frame, natural light, no filters.',
  clipping_detected: 'Avoid strong backlight or harsh shadows. Stand in even, natural light.',
  channel_correlation_high: 'Stand near natural daylight. Avoid filters.',
  unsupported_format: 'Use a JPEG or PNG image.',
};

export async function checkImageQualityFromBuffer(buffer: Buffer): Promise<ImageQualityResult> {
  let sharp: typeof import('sharp') | null = null;
  try {
    const mod = await import('sharp');
    const s = (mod as Record<string, unknown>).default ?? mod;
    sharp = typeof s === 'function' ? (s as typeof import('sharp')) : null;
  } catch {
    return {
      ok: false,
      reason: 'unsupported_format',
      message: 'Image processing is not available.',
      instruction: REJECT_INSTRUCTIONS.unsupported_format,
    };
  }

  if (!sharp) {
    return {
      ok: false,
      reason: 'unsupported_format',
      message: 'Image processing is not available.',
      instruction: REJECT_INSTRUCTIONS.unsupported_format,
    };
  }

  try {
    const meta = await sharp(buffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      return {
        ok: false,
        reason: 'insufficient_resolution',
        message: 'Photo-based analysis requires higher resolution and full-frame capture.',
        minResolution: { width: MIN_WIDTH, height: MIN_HEIGHT },
        instruction: REJECT_INSTRUCTIONS.insufficient_resolution,
      };
    }

    // Resize for performance (max 512 on longest side), get raw RGB
    const pipeline = sharp(buffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .raw();
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const channels = info.channels;
    const n = w * h;

    if (channels < 3) {
      return {
        ok: false,
        reason: 'unsupported_format',
        message: 'Image must have RGB channels.',
        instruction: REJECT_INSTRUCTIONS.unsupported_format,
      };
    }

    // Clipping: fraction of pixels at 0 or 255 in any channel
    let clipped = 0;
    for (let i = 0; i < n * channels; i++) {
      const v = data[i];
      if (v === 0 || v === 255) clipped++;
    }
    const clippingRatio = clipped / (n * channels);
    if (clippingRatio > MAX_CLIPPING_RATIO) {
      return {
        ok: false,
        reason: 'clipping_detected',
        message: 'Too much of the image is over- or underexposed.',
        instruction: REJECT_INSTRUCTIONS.clipping_detected,
      };
    }

    // Channel correlation (R-G, R-B, G-B). High correlation suggests gray-world / flat WB.
    const r = new Float64Array(n);
    const g = new Float64Array(n);
    const b = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      r[i] = data[i * channels];
      g[i] = data[i * channels + 1];
      b[i] = data[i * channels + 2];
    }
    const corrRG = correlation(r, g);
    const corrRB = correlation(r, b);
    const corrGB = correlation(g, b);
    if (
      Math.abs(corrRG) > MAX_CHANNEL_CORRELATION ||
      Math.abs(corrRB) > MAX_CHANNEL_CORRELATION ||
      Math.abs(corrGB) > MAX_CHANNEL_CORRELATION
    ) {
      return {
        ok: false,
        reason: 'channel_correlation_high',
        message: 'Lighting or color balance makes analysis unreliable.',
        instruction: REJECT_INSTRUCTIONS.channel_correlation_high,
      };
    }

    // Laplacian variance (blur). Use grayscale: 0.299*R + 0.587*G + 0.114*B
    const gray = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      gray[i] = 0.299 * r[i] + 0.587 * g[i] + 0.114 * b[i];
    }
    const lapVariance = laplacianVariance(gray, w, h);
    if (lapVariance < MIN_LAPLACIAN_VARIANCE) {
      return {
        ok: false,
        reason: 'blur_detected',
        message: 'Image is too blurry for accurate analysis.',
        instruction: REJECT_INSTRUCTIONS.blur_detected,
      };
    }

    return {
      ok: true,
      minResolution: { width: MIN_WIDTH, height: MIN_HEIGHT },
    };
  } catch (err) {
    console.error('[imageQualityGateServer]', err);
    return {
      ok: false,
      reason: 'unsupported_format',
      message: 'Could not process image.',
      instruction: REJECT_INSTRUCTIONS.unsupported_format,
    };
  }
}

function mean(arr: Float64Array): number {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}

function correlation(a: Float64Array, b: Float64Array): number {
  const n = a.length;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const va = a[i] - ma;
    const vb = b[i] - mb;
    num += va * vb;
    da += va * va;
    db += vb * vb;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

// 3x3 Laplacian kernel; compute variance of Laplacian response (blur -> low variance)
function laplacianVariance(gray: Float64Array, w: number, h: number): number {
  const out = new Float64Array(gray.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v =
        -gray[i - w] - gray[i - 1] + 4 * gray[i] - gray[i + 1] - gray[i + w];
      out[i] = v;
    }
  }
  const n = (w - 2) * (h - 2);
  let sum = 0;
  let sumSq = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const v = out[y * w + x];
      sum += v;
      sumSq += v * v;
    }
  }
  const m = sum / n;
  return sumSq / n - m * m;
}
