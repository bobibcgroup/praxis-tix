/**
 * PRAXIS OUTFIT SCORING ENGINE
 * Deterministic scoring logic that ranks outfits based on Style DNA, body, color, and context.
 * No randomness. No lucky matches. User always sees the 3 best-fitting outfits for THEM.
 */

import type { OccasionType } from '@/types/praxis';
import type { MatrixOutfitEntry, TierType, SkinToneFit, ContrastFit, BodyTypeFit } from './outfitMatrix';
import { getValidMatrixOutfits } from './outfitMatrix';

// ============= STYLE DNA STRUCTURE =============

export type SkinToneFamily = 'warm' | 'cool' | 'neutral';
export type ContrastLevel = 'low' | 'medium' | 'high';
export type BuildType = 'lean' | 'average' | 'solid';
export type FaceShape = 'round' | 'square' | 'long' | 'oval';
export type FitPreference = 'slim' | 'regular' | 'relaxed';
export type StyleDirection = 
  | 'quiet luxury' 
  | 'smart casual' 
  | 'modern minimal' 
  | 'elevated street' 
  | 'classic tailored' 
  | 'relaxed weekend';

export interface BodyProportions {
  shoulders: 'narrow' | 'average' | 'broad';
  torso: 'short' | 'average' | 'long';
  legs: 'short' | 'average' | 'long';
}

export interface LifestyleWeights {
  DATE?: number;
  WORK?: number;
  DINNER?: number;
  PARTY?: number;
  WEDDING?: number;
}

export interface UploadedItem {
  category: 'top' | 'jacket' | 'bottom' | 'shoes';
  color?: string;
  style?: string;
}

export interface StyleDNA {
  skinToneFamily: SkinToneFamily;
  contrastLevel: ContrastLevel;
  bodyProportions?: BodyProportions;
  buildType: BuildType;
  faceShape?: FaceShape;
  fitPreference: FitPreference;
  styleDirection: StyleDirection;
  lifestyleWeights?: LifestyleWeights;
  uploadedItems?: UploadedItem[];
  occasion: OccasionType;
  budgetSensitivity?: 'low' | 'medium' | 'high';
  height?: number; // in cm
}

// ============= SCORING BREAKDOWN =============

export interface ScoringBreakdown {
  skinToneMatch: number;      // 0-25
  contrastHarmony: number;    // 0-15
  bodyProportionFit: number;  // 0-20
  fitPreferenceAlign: number; // 0-10
  styleDirectionAlign: number;// 0-10
  occasionApprop: number;     // 0-10
  lifestyleWeight: number;    // 0-5
  uploadedItemCompat: number; // 0-5
  total: number;              // sum
}

export interface ScoredOutfit {
  outfit: MatrixOutfitEntry;
  score: number;
  breakdown: ScoringBreakdown;
}

// ============= SCORING FUNCTIONS =============

/**
 * Score skin tone match (0-25 points)
 */
function scoreSkinToneMatch(
  outfit: MatrixOutfitEntry, 
  skinTone: SkinToneFamily
): number {
  const outfitFits = outfit.skin_tone_fit;
  
  // Map StyleDNA skinToneFamily to MatrixOutfitEntry skin_tone_fit
  const skinToneMap: Record<SkinToneFamily, SkinToneFit> = {
    warm: 'warm',
    cool: 'cool',
    neutral: 'neutral'
  };
  
  const targetFit = skinToneMap[skinTone];
  
  if (outfitFits.includes(targetFit)) {
    // Perfect match
    return 25;
  }
  
  if (outfitFits.includes('neutral')) {
    // Neutral works for everyone - good match
    return 18;
  }
  
  // Check for adjacent compatibility
  if (skinTone === 'neutral') {
    // Neutral users can wear warm or cool reasonably well
    return 18;
  }
  
  // Poor match - opposite tone
  return -10;
}

/**
 * Score contrast harmony (0-15 points)
 */
function scoreContrastHarmony(
  outfit: MatrixOutfitEntry,
  contrastLevel: ContrastLevel
): number {
  const outfitContrast = outfit.contrast_fit;
  
  const contrastMap: Record<ContrastLevel, ContrastFit> = {
    low: 'low',
    medium: 'medium',
    high: 'high'
  };
  
  const targetContrast = contrastMap[contrastLevel];
  
  if (outfitContrast.includes(targetContrast)) {
    return 15;
  }
  
  // Adjacent contrast levels
  const adjacentPairs: Record<ContrastLevel, ContrastFit[]> = {
    low: ['medium'],
    medium: ['low', 'high'],
    high: ['medium']
  };
  
  const adjacent = adjacentPairs[contrastLevel];
  if (outfitContrast.some(c => adjacent.includes(c))) {
    return 8;
  }
  
  // Poor match
  return -5;
}

/**
 * Score body proportion fit (0-20 points)
 */
function scoreBodyProportionFit(
  outfit: MatrixOutfitEntry,
  buildType: BuildType,
  proportions?: BodyProportions
): number {
  const outfitBodyFits = outfit.body_type_fit;
  
  // Map buildType to body_type_fit
  const buildMap: Record<BuildType, BodyTypeFit> = {
    lean: 'slim',
    average: 'athletic',
    solid: 'broader'
  };
  
  const targetFit = buildMap[buildType];
  
  let score = 0;
  
  // Primary build match
  if (outfitBodyFits.includes(targetFit)) {
    score += 15;
  } else if (outfitBodyFits.includes('athletic')) {
    // Athletic is a flexible middle ground
    score += 10;
  } else {
    score -= 10;
  }
  
  // Proportion-specific adjustments
  if (proportions) {
    // Long torso benefits from higher-rise trousers, structured layers
    if (proportions.torso === 'long' && outfit.formality_level >= 3) {
      score += 3;
    }
    
    // Short legs benefit from clean, elongating silhouettes
    if (proportions.legs === 'short' && outfit.formality_level >= 3) {
      score += 2;
    }
    
    // Narrow shoulders benefit from structured jackets
    if (proportions.shoulders === 'narrow' && outfit.items.top?.includes('blazer')) {
      score += 2;
    }
  }
  
  return Math.min(20, Math.max(-10, score));
}

/**
 * Score fit preference alignment (0-10 points)
 */
function scoreFitPreferenceAlignment(
  outfit: MatrixOutfitEntry,
  fitPreference: FitPreference
): number {
  const outfitBodyFits = outfit.body_type_fit;
  
  // Map fit preference to expected body fits
  const fitMap: Record<FitPreference, BodyTypeFit[]> = {
    slim: ['slim'],
    regular: ['slim', 'athletic'],
    relaxed: ['athletic', 'broader']
  };
  
  const expectedFits = fitMap[fitPreference];
  
  if (outfitBodyFits.some(f => expectedFits.includes(f))) {
    return 10;
  }
  
  // Check for acceptable range
  if (fitPreference === 'regular') {
    return 5; // Regular is flexible
  }
  
  return 0;
}

/**
 * Score style direction alignment (0-10 points)
 */
function scoreStyleDirectionAlignment(
  outfit: MatrixOutfitEntry,
  styleDirection: StyleDirection
): number {
  const outfitTaste = outfit.taste_fit;
  const outfitVibe = outfit.vibe;
  
  // Style direction to taste mapping
  const styleToTaste: Record<StyleDirection, string[]> = {
    'quiet luxury': ['elevated', 'classic'],
    'smart casual': ['classic', 'minimalist'],
    'modern minimal': ['minimalist', 'elevated'],
    'elevated street': ['elevated', 'minimalist'],
    'classic tailored': ['classic', 'elevated'],
    'relaxed weekend': ['minimalist', 'classic']
  };
  
  // Style direction to vibe mapping
  const styleToVibe: Record<StyleDirection, string[]> = {
    'quiet luxury': ['safe', 'sharp'],
    'smart casual': ['safe', 'relaxed'],
    'modern minimal': ['sharp', 'safe'],
    'elevated street': ['sharp', 'relaxed'],
    'classic tailored': ['safe', 'sharp'],
    'relaxed weekend': ['relaxed', 'safe']
  };
  
  const expectedTastes = styleToTaste[styleDirection];
  const expectedVibes = styleToVibe[styleDirection];
  
  let score = 0;
  
  // Taste alignment
  if (outfitTaste.some(t => expectedTastes.includes(t))) {
    score += 5;
  } else {
    score += 1; // Adjacent
  }
  
  // Vibe alignment
  if (expectedVibes.includes(outfitVibe)) {
    score += 5;
  } else {
    score += 1;
  }
  
  return Math.min(10, score);
}

/**
 * Score occasion appropriateness (0-10 points)
 */
function scoreOccasionAppropriateness(
  outfit: MatrixOutfitEntry,
  occasion: OccasionType
): number {
  if (outfit.occasion === occasion) {
    return 10;
  }
  
  // Adjacent occasion compatibility
  const occasionAdjacency: Record<OccasionType, OccasionType[]> = {
    DATE: ['DINNER', 'PARTY'],
    WORK: ['DINNER', 'WEDDING'],
    DINNER: ['DATE', 'WORK', 'WEDDING'],
    PARTY: ['DATE', 'DINNER'],
    WEDDING: ['WORK', 'DINNER']
  };
  
  if (occasionAdjacency[occasion]?.includes(outfit.occasion)) {
    return 6;
  }
  
  return 0;
}

/**
 * Score lifestyle weighting (0-5 points)
 */
function scoreLifestyleWeighting(
  outfit: MatrixOutfitEntry,
  lifestyleWeights?: LifestyleWeights
): number {
  if (!lifestyleWeights) {
    return 2; // Neutral
  }
  
  const occasionWeight = lifestyleWeights[outfit.occasion] || 0;
  const maxWeight = Math.max(...Object.values(lifestyleWeights));
  
  if (maxWeight === 0) {
    return 2;
  }
  
  const normalizedWeight = occasionWeight / maxWeight;
  
  if (normalizedWeight >= 0.7) {
    return 5; // Frequent use
  } else if (normalizedWeight >= 0.3) {
    return 2; // Neutral
  }
  
  return 0; // Rare
}

/**
 * Score uploaded item compatibility (0-5 points)
 */
function scoreUploadedItemCompatibility(
  outfit: MatrixOutfitEntry,
  uploadedItems?: UploadedItem[]
): number {
  if (!uploadedItems || uploadedItems.length === 0) {
    return 3; // Neutral - no items to conflict
  }
  
  let compatibilityScore = 0;
  let conflictCount = 0;
  
  for (const item of uploadedItems) {
    // Check if outfit palette complements uploaded item color
    if (item.color) {
      const outfitPalette = outfit.palette.map(c => c.toLowerCase());
      const itemColor = item.color.toLowerCase();
      
      // Complementary color check (simplified)
      const neutralColors = ['white', 'black', 'grey', 'gray', 'navy', 'charcoal'];
      
      if (neutralColors.includes(itemColor) || outfitPalette.some(c => neutralColors.includes(c))) {
        compatibilityScore += 1;
      } else if (outfitPalette.includes(itemColor)) {
        compatibilityScore += 2; // Direct match
      } else {
        // Potential conflict
        conflictCount += 1;
      }
    }
  }
  
  if (conflictCount >= 2) {
    return -5; // Multiple conflicts
  } else if (conflictCount === 1) {
    return 2; // Partial compatibility
  }
  
  return Math.min(5, compatibilityScore);
}

// ============= MAIN SCORING FUNCTION =============

/**
 * Calculate total score for an outfit against Style DNA
 */
export function scoreOutfit(
  outfit: MatrixOutfitEntry,
  styleDNA: StyleDNA
): ScoredOutfit {
  const breakdown: ScoringBreakdown = {
    skinToneMatch: scoreSkinToneMatch(outfit, styleDNA.skinToneFamily),
    contrastHarmony: scoreContrastHarmony(outfit, styleDNA.contrastLevel),
    bodyProportionFit: scoreBodyProportionFit(outfit, styleDNA.buildType, styleDNA.bodyProportions),
    fitPreferenceAlign: scoreFitPreferenceAlignment(outfit, styleDNA.fitPreference),
    styleDirectionAlign: scoreStyleDirectionAlignment(outfit, styleDNA.styleDirection),
    occasionApprop: scoreOccasionAppropriateness(outfit, styleDNA.occasion),
    lifestyleWeight: scoreLifestyleWeighting(outfit, styleDNA.lifestyleWeights),
    uploadedItemCompat: scoreUploadedItemCompatibility(outfit, styleDNA.uploadedItems),
    total: 0
  };
  
  breakdown.total = 
    breakdown.skinToneMatch +
    breakdown.contrastHarmony +
    breakdown.bodyProportionFit +
    breakdown.fitPreferenceAlign +
    breakdown.styleDirectionAlign +
    breakdown.occasionApprop +
    breakdown.lifestyleWeight +
    breakdown.uploadedItemCompat;
  
  return {
    outfit,
    score: breakdown.total,
    breakdown
  };
}

// ============= SELECTION ENGINE =============

export interface SelectionResult {
  safe: ScoredOutfit | null;
  sharp: ScoredOutfit | null;
  relaxed: ScoredOutfit | null;
  allScored: ScoredOutfit[];
}

/**
 * Select the top 3 outfits based on Style DNA scoring
 * Returns one safe, one sharp, one relaxed - all scoring 50+ minimum
 */
export function selectTopOutfits(
  styleDNA: StyleDNA,
  excludeIds: string[] = []
): SelectionResult {
  const allOutfits = getValidMatrixOutfits();
  
  // Filter by occasion first
  const occasionOutfits = allOutfits.filter(o => o.occasion === styleDNA.occasion);
  
  // Exclude already-used outfits
  const availableOutfits = occasionOutfits.filter(o => !excludeIds.includes(o.id));
  
  // Score all available outfits
  const scoredOutfits = availableOutfits.map(o => scoreOutfit(o, styleDNA));
  
  // Filter out low scores (< 50)
  const qualifiedOutfits = scoredOutfits.filter(so => so.score >= 50);
  
  // Sort by score descending
  qualifiedOutfits.sort((a, b) => b.score - a.score);
  
  // Select by tier with diversity
  const usedPalettes = new Set<string>();
  const usedSilhouettes = new Set<string>();
  
  function selectBestForTier(tier: 'safe' | 'sharp' | 'relaxed'): ScoredOutfit | null {
    const tierMap: Record<string, TierType> = {
      safe: 'SAFEST',
      sharp: 'SHARPER',
      relaxed: 'RELAXED'
    };
    
    const targetTier = tierMap[tier];
    
    // Find best outfit for this tier with palette/silhouette diversity
    for (const scored of qualifiedOutfits) {
      if (scored.outfit.tier !== targetTier) continue;
      
      // Check palette diversity
      const paletteKey = scored.outfit.palette.slice(0, 2).sort().join('-');
      if (usedPalettes.has(paletteKey)) continue;
      
      // Check silhouette diversity (based on formality level as proxy)
      const silhouetteKey = `${scored.outfit.formality_level}-${scored.outfit.vibe}`;
      if (usedSilhouettes.has(silhouetteKey)) continue;
      
      // This outfit passes all checks
      usedPalettes.add(paletteKey);
      usedSilhouettes.add(silhouetteKey);
      
      return scored;
    }
    
    // Fallback: just get highest score for tier without diversity check
    return qualifiedOutfits.find(so => so.outfit.tier === targetTier) || null;
  }
  
  const result: SelectionResult = {
    safe: selectBestForTier('safe'),
    sharp: selectBestForTier('sharp'),
    relaxed: selectBestForTier('relaxed'),
    allScored: scoredOutfits
  };
  
  return result;
}

// ============= DEFAULTS & UTILITIES =============

/**
 * Create default Style DNA when no personal data available
 */
export function createDefaultStyleDNA(occasion: OccasionType): StyleDNA {
  return {
    skinToneFamily: 'neutral',
    contrastLevel: 'medium',
    buildType: 'average',
    fitPreference: 'regular',
    styleDirection: 'smart casual',
    occasion
  };
}

/**
 * Get stylist-friendly explanation (no scores shown)
 */
export function getStylistExplanation(scored: ScoredOutfit): string {
  const { breakdown } = scored;
  
  // Prioritize the highest-scoring aspects
  const aspects: { key: string; score: number; text: string }[] = [
    { key: 'skinTone', score: breakdown.skinToneMatch, text: 'your coloring' },
    { key: 'contrast', score: breakdown.contrastHarmony, text: 'your natural contrast' },
    { key: 'proportion', score: breakdown.bodyProportionFit, text: 'your proportions' },
    { key: 'style', score: breakdown.styleDirectionAlign, text: 'your style' },
    { key: 'fit', score: breakdown.fitPreferenceAlign, text: 'how you like to dress' }
  ];
  
  // Sort by score and take top 2
  aspects.sort((a, b) => b.score - a.score);
  const topTwo = aspects.slice(0, 2);
  
  if (topTwo.length >= 2) {
    return `Chosen to suit ${topTwo[0].text} and ${topTwo[1].text}.`;
  }
  
  return 'Chosen to suit your style, coloring, and proportions.';
}

/**
 * Check if alternatives are available for a given Style DNA
 */
export function hasAlternatives(
  styleDNA: StyleDNA,
  excludeIds: string[]
): boolean {
  const result = selectTopOutfits(styleDNA, excludeIds);
  return result.safe !== null || result.sharp !== null || result.relaxed !== null;
}
