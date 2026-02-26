/**
 * Demo vs Retail mode for retailer readiness.
 * Demo = Praxis curated outfits (current). Retail = partner inventory (placeholder for now).
 */

const KEY = 'praxis_retail_mode';

export function getRetailMode(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function setRetailMode(value: boolean): void {
  try {
    localStorage.setItem(KEY, value ? 'true' : 'false');
  } catch {
    // ignore
  }
}
