import type { 
  PersonalData, 
  Outfit, 
  OutfitLabel, 
  StyleColorProfile, 
  PaletteType, 
  ContrastLevel,
  BodyProportions,
  FaceShape,
  LifestyleUsageData,
} from '@/types/praxis';
import { getValidOutfits, type OutfitEntry } from './outfitLibrary';
import { 
  SKIN_TONE_PALETTES, 
  CONTRAST_STYLES, 
  getDetailedPaletteHint,
  getSkinToneWhatWorks,
  getSkinToneWhatToAvoid,
  getRecommendedSwatches,
  getMetalRecommendations,
} from './skinToneStyling';

// ============= LIFESTYLE USAGE TRACKING =============
const USAGE_STORAGE_KEY = 'praxis_lifestyle_usage';

function getLifestyleUsage(): LifestyleUsageData {
  try {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { occasionCounts: {}, lastUpdated: new Date().toISOString() };
}

export function trackOccasionUsage(occasion: string): void {
  const usage = getLifestyleUsage();
  usage.occasionCounts[occasion] = (usage.occasionCounts[occasion] || 0) + 1;
  usage.lastUpdated = new Date().toISOString();
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // Ignore storage errors
  }
}

function getOccasionWeights(): Record<string, number> {
  const usage = getLifestyleUsage();
  const total = Object.values(usage.occasionCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return {};
  
  const weights: Record<string, number> = {};
  for (const [occasion, count] of Object.entries(usage.occasionCounts)) {
    weights[occasion] = count / total;
  }
  return weights;
}

// Re-export for backwards compatibility and easy access
export { 
  SKIN_TONE_PALETTES, 
  CONTRAST_STYLES,
  getRecommendedSwatches,
  getSkinToneWhatWorks,
  getSkinToneWhatToAvoid,
  getMetalRecommendations,
} from './skinToneStyling';

// ============= PERSONAL FLOW GENERATOR =============
// Generates outfits based on personal profile data
// Uses same locked library but with personal-flow labels

const PERSONAL_LABELS: OutfitLabel[] = ['Best for you', 'More expressive', 'More relaxed'];

// Default color profile when no photo
const DEFAULT_COLOR_PROFILE: StyleColorProfile = {
  palette: 'neutral',
  contrast: 'medium',
};

// Get palette hint for Style DNA display
export function getPaletteHint(data: PersonalData): string | null {
  return getDetailedPaletteHint(data.skinTone?.bucket, data.contrastLevel);
}

// Derive style color profile from skin tone data
export function deriveStyleColorProfile(data: PersonalData): StyleColorProfile {
  if (!data.skinTone?.bucket) {
    return DEFAULT_COLOR_PROFILE;
  }
  
  const palette = SKIN_TONE_PALETTES[data.skinTone.bucket];
  return {
    palette: palette.paletteType,
    contrast: data.contrastLevel || 'medium',
  };
}

// Check if an outfit matches the color profile
// This is a soft scoring system - outfits are ranked, not excluded
function getColorProfileScore(entry: OutfitEntry, profile: StyleColorProfile): number {
  let score = 50; // Base score
  
  // Palette-based scoring
  const itemText = `${entry.items.top} ${entry.items.bottom} ${entry.items.shoes} ${entry.items.extras || ''}`.toLowerCase();
  
  if (profile.palette === 'warm') {
    // Warm tones: cream, beige, camel, olive, warm navy, brown, gold
    if (itemText.includes('cream') || itemText.includes('beige') || itemText.includes('camel')) score += 15;
    if (itemText.includes('olive') || itemText.includes('brown') || itemText.includes('tan')) score += 15;
    if (itemText.includes('navy') || itemText.includes('gold')) score += 10;
    // Avoid pure black/white for warm
    if (itemText.includes('black shirt') || itemText.includes('crisp white')) score -= 5;
  } else if (profile.palette === 'cool') {
    // Cool tones: crisp white, charcoal, navy, black, blue-gray, burgundy, silver
    if (itemText.includes('white') || itemText.includes('crisp')) score += 15;
    if (itemText.includes('charcoal') || itemText.includes('navy') || itemText.includes('black')) score += 15;
    if (itemText.includes('blue') || itemText.includes('burgundy') || itemText.includes('silver')) score += 10;
    // Avoid warm tones for cool
    if (itemText.includes('beige') || itemText.includes('camel') || itemText.includes('brown')) score -= 5;
  } else {
    // Neutral: balanced palettes work well
    if (itemText.includes('neutral') || itemText.includes('navy') || itemText.includes('charcoal')) score += 10;
    if (itemText.includes('white') || itemText.includes('black')) score += 5;
  }
  
  // Contrast-based scoring
  if (profile.contrast === 'low') {
    // Low contrast: soft transitions, similar tones
    if (itemText.includes('light') && !itemText.includes('dark')) score += 10;
    if (itemText.includes('neutral') || itemText.includes('soft')) score += 10;
    // Avoid stark contrasts
    if (itemText.includes('black') && itemText.includes('white')) score -= 10;
  } else if (profile.contrast === 'high') {
    // High contrast: strong light/dark separation
    if (itemText.includes('black') || itemText.includes('white')) score += 10;
    if (itemText.includes('crisp') || itemText.includes('dark')) score += 10;
    // Bold choices score higher
    if (itemText.includes('navy') && itemText.includes('white')) score += 15;
  }
  // Medium contrast: no adjustments needed
  
  return score;
}

// ============= BODY PROPORTION SCORING =============
// Scoring based on proportion-friendly styling rules

// Default proportions when no photo
const DEFAULT_PROPORTIONS: BodyProportions = {
  shoulders: 'average',
  torso: 'balanced',
  legs: 'balanced',
  build: 'average',
};

// Get proportion score for an outfit
function getProportionScore(entry: OutfitEntry, proportions: BodyProportions): number {
  let score = 50; // Base score
  
  const itemText = `${entry.items.top} ${entry.items.bottom} ${entry.items.shoes} ${entry.items.extras || ''}`.toLowerCase();
  
  // Shoulder-based rules
  if (proportions.shoulders === 'broad') {
    // Broad shoulders: avoid heavy padding, prefer softer structure, balance with straighter bottoms
    if (itemText.includes('unstructured') || itemText.includes('soft')) score += 10;
    if (itemText.includes('padded') || itemText.includes('structured blazer')) score -= 5;
    if (itemText.includes('straight') || itemText.includes('regular fit')) score += 10;
  } else if (proportions.shoulders === 'narrow') {
    // Narrow shoulders: add structure and layers, emphasize upper body
    if (itemText.includes('structured') || itemText.includes('blazer')) score += 10;
    if (itemText.includes('jacket') || itemText.includes('layer')) score += 10;
    if (itemText.includes('slim') && !itemText.includes('shoulder')) score += 5;
  }
  
  // Torso-based rules
  if (proportions.torso === 'long') {
    // Long torso: higher-rise trousers, shorter jackets, waist contrast
    if (itemText.includes('high-rise') || itemText.includes('high rise')) score += 10;
    if (itemText.includes('cropped') || itemText.includes('short jacket')) score += 10;
    if (itemText.includes('belt') || itemText.includes('tucked')) score += 5;
  } else if (proportions.torso === 'short') {
    // Short torso: longer jackets, lower rise, vertical continuity
    if (itemText.includes('long jacket') || itemText.includes('overcoat')) score += 10;
    if (itemText.includes('low-rise') || itemText.includes('mid-rise')) score += 5;
    if (itemText.includes('untucked') || itemText.includes('same color')) score += 5;
  }
  
  // Leg-based rules
  if (proportions.legs === 'long') {
    // Long legs: add texture or contrast to break length
    if (itemText.includes('texture') || itemText.includes('contrast')) score += 10;
    if (itemText.includes('cuff') || itemText.includes('break')) score += 5;
    if (itemText.includes('patterned') || itemText.includes('bold')) score += 5;
  } else if (proportions.legs === 'short') {
    // Short legs: monochrome bottoms, clean lines, minimal breaks
    if (itemText.includes('dark') && (itemText.includes('trouser') || itemText.includes('pant'))) score += 10;
    if (itemText.includes('clean') || itemText.includes('minimal')) score += 10;
    if (itemText.includes('no break') || itemText.includes('slim')) score += 5;
    if (itemText.includes('cuff') || itemText.includes('contrast')) score -= 5;
  }
  
  // Build-based rules
  if (proportions.build === 'lean') {
    // Lean: layering adds dimension
    if (itemText.includes('layer') || itemText.includes('cardigan')) score += 10;
    if (itemText.includes('textured') || itemText.includes('knit')) score += 5;
  } else if (proportions.build === 'solid') {
    // Solid: vertical lines, darker tones, structured pieces
    if (itemText.includes('vertical') || itemText.includes('stripe')) score += 10;
    if (itemText.includes('dark') || itemText.includes('navy') || itemText.includes('black')) score += 5;
    if (itemText.includes('structured') || itemText.includes('tailored')) score += 10;
  }
  
  return score;
}

// ============= FACE SHAPE SCORING =============
// Neckline and collar rules based on face shape

const DEFAULT_FACE_SHAPE: FaceShape = 'oval';

function getFaceShapeScore(entry: OutfitEntry, faceShape: FaceShape): number {
  let score = 50; // Base score
  
  const itemText = `${entry.items.top} ${entry.items.bottom} ${entry.items.shoes} ${entry.items.extras || ''}`.toLowerCase();
  
  switch (faceShape) {
    case 'round':
      // Round face: open collars, lower buttoning, V-necks
      if (itemText.includes('v-neck') || itemText.includes('open collar')) score += 15;
      if (itemText.includes('unbuttoned') || itemText.includes('low button')) score += 10;
      if (itemText.includes('polo') || itemText.includes('spread collar')) score += 10;
      // Avoid high/closed necklines
      if (itemText.includes('crew neck') || itemText.includes('turtleneck')) score -= 5;
      if (itemText.includes('buttoned up') || itemText.includes('high collar')) score -= 5;
      break;
      
    case 'square':
      // Square face: softer openings, curved lines, rounded collars
      if (itemText.includes('soft') || itemText.includes('rounded')) score += 15;
      if (itemText.includes('crew neck') || itemText.includes('henley')) score += 10;
      if (itemText.includes('casual') || itemText.includes('relaxed')) score += 5;
      // Avoid sharp angles
      if (itemText.includes('pointed') || itemText.includes('sharp')) score -= 5;
      if (itemText.includes('structured collar')) score -= 5;
      break;
      
    case 'long':
      // Long face: higher collars, layers, texture, horizontal elements
      if (itemText.includes('turtleneck') || itemText.includes('mock neck')) score += 15;
      if (itemText.includes('layer') || itemText.includes('scarf')) score += 10;
      if (itemText.includes('textured') || itemText.includes('chunky')) score += 10;
      if (itemText.includes('horizontal') || itemText.includes('stripe')) score += 5;
      // Avoid deep V-necks that elongate
      if (itemText.includes('deep v') || itemText.includes('plunging')) score -= 5;
      break;
      
    case 'oval':
      // Oval: no restrictions, most versatile
      // Slight boost for classic pieces
      if (itemText.includes('classic') || itemText.includes('tailored')) score += 5;
      break;
  }
  
  return score;
}

// ============= TEXTURE MATCHING =============
// Fabric and texture rules based on build and contrast

function getTextureScore(entry: OutfitEntry, build: BodyProportions['build'], contrast: ContrastLevel): number {
  let score = 50; // Base score
  
  const itemText = `${entry.items.top} ${entry.items.bottom} ${entry.items.shoes} ${entry.items.extras || ''}`.toLowerCase();
  
  // Build-based texture rules
  if (build === 'lean') {
    // Lean builds: lighter fabrics, clean drape
    if (itemText.includes('light') || itemText.includes('linen')) score += 10;
    if (itemText.includes('drape') || itemText.includes('flowing')) score += 10;
    if (itemText.includes('thin') || itemText.includes('fine')) score += 5;
    // Heavy fabrics can overwhelm lean frames
    if (itemText.includes('heavy') || itemText.includes('thick')) score -= 5;
  } else if (build === 'solid') {
    // Solid builds: structured, thicker fabrics
    if (itemText.includes('structured') || itemText.includes('tailored')) score += 15;
    if (itemText.includes('thick') || itemText.includes('substantial')) score += 10;
    if (itemText.includes('wool') || itemText.includes('tweed')) score += 5;
    // Flimsy fabrics don't hold shape well
    if (itemText.includes('thin') || itemText.includes('sheer')) score -= 5;
  }
  
  // Contrast-based texture rules
  if (contrast === 'low') {
    // Low contrast: matte, soft textures
    if (itemText.includes('matte') || itemText.includes('soft')) score += 10;
    if (itemText.includes('cotton') || itemText.includes('cashmere')) score += 5;
    if (itemText.includes('subtle') || itemText.includes('tonal')) score += 5;
    // Avoid shiny/crisp textures
    if (itemText.includes('shiny') || itemText.includes('glossy')) score -= 5;
  } else if (contrast === 'high') {
    // High contrast: crisp, sharp textures
    if (itemText.includes('crisp') || itemText.includes('sharp')) score += 15;
    if (itemText.includes('polished') || itemText.includes('clean')) score += 10;
    if (itemText.includes('leather') || itemText.includes('silk')) score += 5;
    // Muted textures may look dull
    if (itemText.includes('matte') || itemText.includes('soft')) score -= 3;
  }
  
  return score;
}

// ============= LIFESTYLE WEIGHTING =============
// Bias toward frequently used occasions

function getLifestyleWeight(entry: OutfitEntry): number {
  const weights = getOccasionWeights();
  const occasionWeight = weights[entry.occasion] || 0;
  
  // Convert weight to score bonus (0-20 points based on usage frequency)
  return Math.round(occasionWeight * 20);
}

// ============= COMBINED SCORING =============

function getCombinedScore(
  entry: OutfitEntry, 
  colorProfile: StyleColorProfile,
  proportions: BodyProportions,
  faceShape: FaceShape,
  hasPhotoAnalysis: boolean
): number {
  let score = 50; // Base score
  
  // Always apply lifestyle weighting
  score += getLifestyleWeight(entry);
  
  if (hasPhotoAnalysis) {
    // Apply all photo-based scoring
    score += getColorProfileScore(entry, colorProfile) - 50; // Normalize around 0
    score += getProportionScore(entry, proportions) - 50;
    score += getFaceShapeScore(entry, faceShape) - 50;
    score += getTextureScore(entry, proportions.build, colorProfile.contrast) - 50;
  }
  
  return score;
}

// Sort outfits by combined score
function sortByCombinedScore(
  outfits: OutfitEntry[],
  colorProfile: StyleColorProfile,
  proportions: BodyProportions,
  faceShape: FaceShape,
  hasPhotoAnalysis: boolean
): OutfitEntry[] {
  return [...outfits].sort((a, b) => {
    const scoreA = getCombinedScore(a, colorProfile, proportions, faceShape, hasPhotoAnalysis);
    const scoreB = getCombinedScore(b, colorProfile, proportions, faceShape, hasPhotoAnalysis);
    return scoreB - scoreA; // Higher score first
  });
}

// Sort outfits by proportion compatibility
function sortByProportions(outfits: OutfitEntry[], proportions: BodyProportions): OutfitEntry[] {
  return [...outfits].sort((a, b) => {
    const scoreA = getProportionScore(a, proportions);
    const scoreB = getProportionScore(b, proportions);
    return scoreB - scoreA; // Higher score first
  });
}

// Sort outfits by color profile compatibility
function sortByColorProfile(outfits: OutfitEntry[], profile: StyleColorProfile): OutfitEntry[] {
  return [...outfits].sort((a, b) => {
    const scoreA = getColorProfileScore(a, profile);
    const scoreB = getColorProfileScore(b, profile);
    return scoreB - scoreA; // Higher score first
  });
}

export function generatePersonalOutfits(data: PersonalData): Outfit[] {
  // Get all valid outfits
  const allOutfits = getValidOutfits();
  
  // For now, select based on lifestyle preference
  let filteredOutfits = [...allOutfits];
  
  // Derive profiles from photo analysis (or use defaults)
  const colorProfile = data.styleColorProfile || deriveStyleColorProfile(data);
  const proportions = data.bodyProportions || DEFAULT_PROPORTIONS;
  const faceShape = data.faceShape?.shape || DEFAULT_FACE_SHAPE;
  const hasPhotoAnalysis = !!data.skinTone?.bucket;
  
  // Prioritize by lifestyle if specified
  if (data.lifestyle) {
    const lifestyleOccasionMap: Record<string, string[]> = {
      'WORK': ['WORK', 'MEETING', 'CONFERENCE'],
      'SOCIAL': ['PARTY', 'DATE', 'DINNER'],
      'CASUAL': ['DATE', 'DINNER'],
      'MIXED': ['WORK', 'DINNER', 'DATE'],
    };
    
    const preferredOccasions = lifestyleOccasionMap[data.lifestyle] || [];
    const lifestyleFiltered = filteredOutfits.filter(o => 
      preferredOccasions.includes(o.occasion)
    );
    
    if (lifestyleFiltered.length >= 3) {
      filteredOutfits = lifestyleFiltered;
    }
  }
  
  // Apply combined scoring (color, proportions, face shape, texture, lifestyle)
  filteredOutfits = sortByCombinedScore(
    filteredOutfits, 
    colorProfile, 
    proportions, 
    faceShape,
    hasPhotoAnalysis
  );
  
  // Find one of each tier (from sorted list, best matches first)
  const safest = filteredOutfits.find(o => o.tier === 'SAFEST');
  const sharper = filteredOutfits.find(o => o.tier === 'SHARPER');
  const relaxed = filteredOutfits.find(o => o.tier === 'RELAXED');
  
  const results: Outfit[] = [];
  
  // Build styling context from photo analysis
  const stylingContext = buildStylingContext(data);
  
  if (safest) {
    results.push(convertToPersonalOutfit(safest, 1, PERSONAL_LABELS[0], stylingContext));
  }
  if (sharper) {
    results.push(convertToPersonalOutfit(sharper, 2, PERSONAL_LABELS[1], stylingContext));
  }
  if (relaxed) {
    results.push(convertToPersonalOutfit(relaxed, 3, PERSONAL_LABELS[2], stylingContext));
  }
  
  return results;
}

interface StylingContext {
  paletteType?: PaletteType;
  contrastStyle?: 'monochrome' | 'balanced' | 'high-contrast';
  skinToneHex?: string;
  hasPhotoAnalysis: boolean;
}

function buildStylingContext(data: PersonalData): StylingContext {
  const context: StylingContext = {
    hasPhotoAnalysis: !!data.skinTone?.bucket,
  };
  
  // Add palette hint based on skin tone
  if (data.skinTone?.bucket) {
    const palette = SKIN_TONE_PALETTES[data.skinTone.bucket];
    context.paletteType = palette.paletteType;
    context.skinToneHex = data.skinTone.hex;
  }
  
  // Add contrast style
  if (data.contrastLevel) {
    context.contrastStyle = CONTRAST_STYLES[data.contrastLevel].style;
  }
  
  return context;
}

function convertToPersonalOutfit(
  entry: OutfitEntry, 
  id: number, 
  label: OutfitLabel,
  _stylingContext: StylingContext
): Outfit {
  return {
    id,
    title: entry.title,
    label,
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
