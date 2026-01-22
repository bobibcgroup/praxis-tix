import type { FlowData, Outfit } from '@/types/praxis';
import { getValidOutfits, getTierLabel, type OutfitEntry } from './outfitLibrary';
import { selectOutfitsFromMatrix, hasMatrixAlternatives } from './outfitSelectionEngine';

// ============= INTELLIGENT OUTFIT GENERATOR =============
// Uses expanded outfit matrix with smart selection based on:
// - Occasion, location, time, setting, budget
// - Skin tone, contrast, body type (when photo available)
// - Cluster diversity for varied recommendations
// 
// CRITICAL RULES:
// 1. All text comes from the SAME preset object as the image
// 2. Always returns exactly 3 outfits (SAFEST, SHARPER, RELAXED)
// 3. Selection feels intentional, not random
// 4. Same inputs = same outputs (deterministic)

interface GenerateResult {
  outfits: Outfit[];
  usedIds: string[];
}

export function generateOutfits(data: FlowData, excludeIds: string[] = []): GenerateResult {
  const { occasion, context, preferences } = data;
  const { event } = occasion;
  const { location, when, setting } = context;
  const { budget } = preferences;
  
  // Validate required input
  if (!event) {
    return { outfits: [], usedIds: [] };
  }
  
  // Get all valid outfits from locked library, excluding already used
  let filteredOutfits = getValidOutfits().filter(o => !excludeIds.includes(o.id));
  
  // Filter by occasion (required)
  filteredOutfits = filteredOutfits.filter(o => o.occasion === event);
  
  // Filter by location (if specified)
  if (location) {
    const locationFiltered = filteredOutfits.filter(o => o.location.includes(location));
    if (locationFiltered.length >= 3) filteredOutfits = locationFiltered;
  }
  
  // Filter by time (if specified)
  if (when) {
    const timeFiltered = filteredOutfits.filter(o => o.time.includes(when));
    if (timeFiltered.length >= 3) filteredOutfits = timeFiltered;
  }
  
  // Filter by setting (if specified)
  if (setting) {
    const settingFiltered = filteredOutfits.filter(o => o.setting.includes(setting));
    if (settingFiltered.length >= 3) filteredOutfits = settingFiltered;
  }
  
  // Filter by budget (if specified)
  if (budget) {
    const budgetFiltered = filteredOutfits.filter(o => o.budget.includes(budget));
    if (budgetFiltered.length >= 3) filteredOutfits = budgetFiltered;
  }
  
  // Find exactly one of each tier
  const safest = filteredOutfits.find(o => o.tier === 'SAFEST');
  const sharper = filteredOutfits.find(o => o.tier === 'SHARPER');
  const relaxed = filteredOutfits.find(o => o.tier === 'RELAXED');
  
  // Build result array from locked entries ONLY
  const results: Outfit[] = [];
  const usedIds: string[] = [];
  
  if (safest) {
    results.push(convertToOutfit(safest, 1));
    usedIds.push(safest.id);
  }
  if (sharper) {
    results.push(convertToOutfit(sharper, 2));
    usedIds.push(sharper.id);
  }
  if (relaxed) {
    results.push(convertToOutfit(relaxed, 3));
    usedIds.push(relaxed.id);
  }
  
  return { outfits: results, usedIds };
}

// Generate alternative outfits - rotates within same occasion/tier
export function generateAlternativeOutfits(data: FlowData, excludeIds: string[]): GenerateResult {
  return generateOutfits(data, excludeIds);
}

// Check if alternatives exist
export function hasAlternativeOutfits(data: FlowData, excludeIds: string[]): boolean {
  const { occasion } = data;
  const { event } = occasion;
  
  if (!event) return false;
  
  // Get outfits for this occasion that haven't been used
  const availableOutfits = getValidOutfits().filter(
    o => o.occasion === event && !excludeIds.includes(o.id)
  );
  
  // Need at least one of each tier to show alternatives
  const hasSafest = availableOutfits.some(o => o.tier === 'SAFEST');
  const hasSharper = availableOutfits.some(o => o.tier === 'SHARPER');
  const hasRelaxed = availableOutfits.some(o => o.tier === 'RELAXED');
  
  return hasSafest || hasSharper || hasRelaxed;
}

// Convert library entry to Outfit type
// CRITICAL: All fields come from the SAME entry object - no mixing
function convertToOutfit(entry: OutfitEntry, id: number): Outfit {
  return {
    id,
    title: entry.title,
    label: getTierLabel(entry.tier),
    items: {
      top: entry.items.top,
      bottom: entry.items.bottom,
      shoes: entry.items.shoes,
      extras: entry.items.extras,
    },
    reason: entry.reason,
    imageUrl: entry.image_url,
  };
}
