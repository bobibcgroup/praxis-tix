import type { 
  FlowData, 
  Outfit, 
  PersonalData,
  BodyProportions,
  ContrastLevel,
  SkinToneBucket,
  FitPreference,
} from '@/types/praxis';
import { 
  getValidMatrixOutfits, 
  type MatrixOutfitEntry, 
  type SkinToneFit, 
  type ContrastFit, 
  type BodyTypeFit,
  type TierType,
} from './outfitMatrix';

// ============= OUTFIT SELECTION ENGINE =============
// Smart selection from expanded outfit matrix
// Filters → Ranks → Selects top 3 (one per tier)
// CRITICAL: Always returns exactly 3 outfits from different clusters when possible

// ============= TYPE MAPPINGS =============

function mapSkinToneToFit(bucket?: SkinToneBucket): SkinToneFit {
  if (!bucket) return 'neutral';
  const warmBuckets: SkinToneBucket[] = ['tan-olive', 'medium'];
  const coolBuckets: SkinToneBucket[] = ['very-light', 'light', 'deep'];
  if (warmBuckets.includes(bucket)) return 'warm';
  if (coolBuckets.includes(bucket)) return 'cool';
  return 'neutral';
}

function mapContrastToFit(contrast?: ContrastLevel): ContrastFit {
  return contrast || 'medium';
}

function mapBuildToFit(proportions?: BodyProportions, fitPreference?: FitPreference): BodyTypeFit {
  // Fit preference takes priority when available
  if (fitPreference) {
    if (fitPreference === 'slim') return 'slim';
    if (fitPreference === 'relaxed') return 'broader';
    return 'athletic'; // regular
  }
  
  if (!proportions) return 'athletic';
  if (proportions.build === 'lean') return 'slim';
  if (proportions.build === 'solid') return 'broader';
  if (proportions.shoulders === 'broad') return 'broader';
  if (proportions.shoulders === 'narrow') return 'slim';
  return 'athletic';
}

// ============= HEIGHT-BASED ADJUSTMENTS =============
// Uses height to influence jacket length and trouser break preferences

function getHeightScore(entry: MatrixOutfitEntry, heightCm?: number): number {
  if (!heightCm) return 0;
  
  const itemText = `${entry.items.top} ${entry.items.bottom} ${entry.items.shoes} ${entry.items.extras || ''}`.toLowerCase();
  let score = 0;
  
  // Shorter individuals (< 170cm) - favor shorter jackets, minimal breaks
  if (heightCm < 170) {
    if (itemText.includes('cropped') || itemText.includes('short jacket')) score += 5;
    if (itemText.includes('no break') || itemText.includes('slim')) score += 5;
    if (itemText.includes('long jacket') || itemText.includes('overcoat')) score -= 3;
  }
  // Taller individuals (> 185cm) - favor longer proportions, can handle breaks
  else if (heightCm > 185) {
    if (itemText.includes('long') || itemText.includes('overcoat')) score += 5;
    if (itemText.includes('cuff') || itemText.includes('break')) score += 3;
    if (itemText.includes('cropped')) score -= 3;
  }
  
  return score;
}

// ============= FIT PREFERENCE SCORING =============

function getFitPreferenceScore(entry: MatrixOutfitEntry, fitPreference?: FitPreference): number {
  if (!fitPreference) return 0;
  
  const itemText = `${entry.items.top} ${entry.items.bottom} ${entry.items.shoes} ${entry.items.extras || ''}`.toLowerCase();
  let score = 0;
  
  switch (fitPreference) {
    case 'slim':
      if (itemText.includes('slim') || itemText.includes('fitted') || itemText.includes('tailored')) score += 10;
      if (itemText.includes('relaxed') || itemText.includes('loose') || itemText.includes('oversized')) score -= 5;
      break;
    case 'relaxed':
      if (itemText.includes('relaxed') || itemText.includes('loose') || itemText.includes('comfortable')) score += 10;
      if (itemText.includes('slim') || itemText.includes('fitted')) score -= 5;
      break;
    case 'regular':
      // Regular is versatile, slight preference for balanced fits
      if (itemText.includes('regular') || itemText.includes('classic')) score += 5;
      break;
  }
  
  return score;
}

// ============= SKIN TONE SAFETY RULES =============
// Prevent bad color matches

function isSkinToneSafe(entry: MatrixOutfitEntry, skinTone?: SkinToneBucket, contrast?: ContrastLevel): boolean {
  const itemText = `${entry.items.top} ${entry.items.bottom} ${entry.items.shoes} ${entry.items.extras || ''} ${entry.palette.join(' ')}`.toLowerCase();
  
  // Pale skin safety
  if (skinTone === 'very-light' || skinTone === 'light') {
    if (itemText.includes('pale beige') || itemText.includes('pale cream')) return false;
  }
  
  // Low contrast safety - avoid stark contrasts
  if (contrast === 'low') {
    if (itemText.includes('black') && itemText.includes('white')) return false;
    if (entry.palette.includes('black') && entry.palette.includes('white')) return false;
  }
  
  // High contrast - avoid all muted
  if (contrast === 'high') {
    const allMuted = entry.palette.every(c => 
      c.includes('soft') || c.includes('muted') || c.includes('taupe')
    );
    if (allMuted) return false;
  }
  
  return true;
}

// ============= SCORING FUNCTIONS =============

function getSkinToneScore(entry: MatrixOutfitEntry, skinToneFit: SkinToneFit): number {
  if (entry.skin_tone_fit.includes(skinToneFit)) return 20;
  if (entry.skin_tone_fit.includes('neutral')) return 10;
  return 0;
}

function getContrastScore(entry: MatrixOutfitEntry, contrastFit: ContrastFit): number {
  if (entry.contrast_fit.includes(contrastFit)) return 15;
  return 0;
}

function getBodyTypeScore(entry: MatrixOutfitEntry, bodyFit: BodyTypeFit): number {
  if (entry.body_type_fit.includes(bodyFit)) return 15;
  if (entry.body_type_fit.includes('athletic')) return 8; // Athletic is versatile
  return 0;
}

function getConfidenceScore(entry: MatrixOutfitEntry): number {
  return entry.confidence_score * 2; // 2-20 points
}

function getContextScore(entry: MatrixOutfitEntry, data: FlowData): number {
  let score = 0;
  const { context, preferences } = data;
  
  if (context.location && entry.location.includes(context.location)) score += 10;
  if (context.when && entry.time.includes(context.when)) score += 5;
  if (context.setting && entry.setting.includes(context.setting)) score += 5;
  if (preferences.budget && entry.budget.includes(preferences.budget)) score += 5;
  
  return score;
}

function getTotalScore(
  entry: MatrixOutfitEntry,
  skinToneFit: SkinToneFit,
  contrastFit: ContrastFit,
  bodyFit: BodyTypeFit,
  flowData?: FlowData,
  personalData?: PersonalData
): number {
  let score = 50; // Base score
  
  score += getSkinToneScore(entry, skinToneFit);
  score += getContrastScore(entry, contrastFit);
  score += getBodyTypeScore(entry, bodyFit);
  score += getConfidenceScore(entry);
  
  if (flowData) {
    score += getContextScore(entry, flowData);
  }
  
  // Add fit calibration scoring
  if (personalData?.fitCalibration) {
    score += getHeightScore(entry, personalData.fitCalibration.height);
    score += getFitPreferenceScore(entry, personalData.fitCalibration.fitPreference);
  }
  
  return score;
}

// ============= SELECTION FUNCTIONS =============

interface SelectionResult {
  outfits: Outfit[];
  usedIds: string[];
}

// Select best outfit for a specific tier
function selectBestForTier(
  candidates: MatrixOutfitEntry[],
  tier: TierType,
  skinToneFit: SkinToneFit,
  contrastFit: ContrastFit,
  bodyFit: BodyTypeFit,
  flowData?: FlowData,
  personalData?: PersonalData,
  excludeClusters?: Set<string>
): MatrixOutfitEntry | null {
  const tierCandidates = candidates.filter(c => c.tier === tier);
  
  if (tierCandidates.length === 0) return null;
  
  // Score and sort
  const scored = tierCandidates.map(entry => ({
    entry,
    score: getTotalScore(entry, skinToneFit, contrastFit, bodyFit, flowData, personalData),
    cluster: `${entry.skin_tone_fit[0]}_${entry.body_type_fit[0]}`,
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  // Try to pick from a different cluster if possible
  if (excludeClusters && excludeClusters.size > 0) {
    const differentCluster = scored.find(s => !excludeClusters.has(s.cluster));
    if (differentCluster) return differentCluster.entry;
  }
  
  return scored[0]?.entry || null;
}

// Convert matrix entry to Outfit
function convertToOutfit(entry: MatrixOutfitEntry, id: number, label: string): Outfit {
  return {
    id,
    title: entry.title,
    label: label as Outfit['label'],
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

// ============= MAIN SELECTION FUNCTION =============

export function selectOutfitsFromMatrix(
  flowData: FlowData,
  personalData?: PersonalData,
  excludeIds: string[] = []
): SelectionResult {
  const { occasion } = flowData;
  
  if (!occasion.event) {
    return { outfits: [], usedIds: [] };
  }
  
  // Get all valid outfits for this occasion
  let candidates = getValidMatrixOutfits().filter(
    o => o.occasion === occasion.event && !excludeIds.includes(o.id)
  );
  
  // Derive fit types from personal data
  const skinToneFit = mapSkinToneToFit(personalData?.skinTone?.bucket);
  const contrastFit = mapContrastToFit(personalData?.contrastLevel);
  const bodyFit = mapBuildToFit(personalData?.bodyProportions, personalData?.fitCalibration?.fitPreference);
  // Apply skin tone safety filter
  if (personalData?.skinTone?.bucket || personalData?.contrastLevel) {
    candidates = candidates.filter(c => 
      isSkinToneSafe(c, personalData?.skinTone?.bucket, personalData?.contrastLevel)
    );
  }
  
  // Select one from each tier, trying to use different clusters
  const usedClusters = new Set<string>();
  const results: Outfit[] = [];
  const usedIds: string[] = [];
  
  // SAFEST first
  const safest = selectBestForTier(candidates, 'SAFEST', skinToneFit, contrastFit, bodyFit, flowData, personalData, usedClusters);
  if (safest) {
    results.push(convertToOutfit(safest, 1, 'Safest choice'));
    usedIds.push(safest.id);
    usedClusters.add(`${safest.skin_tone_fit[0]}_${safest.body_type_fit[0]}`);
  }
  
  // SHARPER next
  const sharper = selectBestForTier(candidates, 'SHARPER', skinToneFit, contrastFit, bodyFit, flowData, personalData, usedClusters);
  if (sharper) {
    results.push(convertToOutfit(sharper, 2, 'Sharper choice'));
    usedIds.push(sharper.id);
    usedClusters.add(`${sharper.skin_tone_fit[0]}_${sharper.body_type_fit[0]}`);
  }
  
  // RELAXED last
  const relaxed = selectBestForTier(candidates, 'RELAXED', skinToneFit, contrastFit, bodyFit, flowData, personalData, usedClusters);
  if (relaxed) {
    results.push(convertToOutfit(relaxed, 3, 'More relaxed choice'));
    usedIds.push(relaxed.id);
  }
  
  return { outfits: results, usedIds };
}

// Check if alternatives exist
export function hasMatrixAlternatives(flowData: FlowData, excludeIds: string[]): boolean {
  const { occasion } = flowData;
  if (!occasion.event) return false;
  
  const available = getValidMatrixOutfits().filter(
    o => o.occasion === occasion.event && !excludeIds.includes(o.id)
  );
  
  return (
    available.some(o => o.tier === 'SAFEST') ||
    available.some(o => o.tier === 'SHARPER') ||
    available.some(o => o.tier === 'RELAXED')
  );
}
