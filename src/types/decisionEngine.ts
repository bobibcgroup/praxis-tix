/**
 * Decision Engine types: Intent, abstract attributes, garment schema.
 * Aligns with Main targets: AI-shaped infrastructure, mapping layer, retailer readiness.
 */

// ============= INTENT (user inputs → structured) =============

export type IntentDomain = 'advisory' | 'functional' | 'educational' | 'contextual';
export type FormalityLevel = 'low' | 'medium' | 'high';
export type TemperatureContext = 'cool' | 'mild' | 'hot';
export type VibeType = 'sharp' | 'comfort' | 'relaxed' | 'classic' | 'expressive';
export type RiskAppetite = 'low' | 'medium' | 'high';

export interface IntentProfile {
  /** Routing: why the user is here */
  domain?: IntentDomain;
  /** From flow: occasion (event) */
  occasion: string;
  formality: FormalityLevel;
  temperature: TemperatureContext;
  vibe: VibeType;
  risk: RiskAppetite;
  /** e.g. competent_but_relaxed, sharp_but_approachable */
  psychological_goal?: string;
  /** Optional mood tag */
  mood?: string;
  location?: string;
  when?: string;
  setting?: string;
  budget?: string;
  priority?: string;
  constraints?: string[];
}

// ============= ABSTRACT OUTFIT (engine output, before mapping) =============

export type SilhouetteType = 'structured' | 'relaxed' | 'fitted' | 'oversized';
export type PaletteType = 'dark_neutrals' | 'light_neutrals' | 'earth' | 'navy' | 'black' | 'minimal';
export type FabricWeight = 'light' | 'medium' | 'heavy';

export interface AbstractOutfitAttributes {
  formality: FormalityLevel;
  silhouette: SilhouetteType;
  palette: PaletteType;
  fabric_weight: FabricWeight;
  vibe: VibeType;
  /** Tier for demo: SAFEST | SHARPER | RELAXED */
  tier: 'SAFEST' | 'SHARPER' | 'RELAXED';
}

// ============= GARMENT SCHEMA (universal) =============

export type GarmentCategory = 'jacket' | 'top' | 'bottom' | 'shoes' | 'accessory';
export type PatternType = 'solid' | 'striped' | 'checked' | 'textured' | 'patterned';

export interface GarmentSchema {
  category: GarmentCategory;
  silhouette: SilhouetteType;
  fabric_weight: FabricWeight;
  color_family: string;
  pattern: PatternType;
  occasion_suitability: string[];
  formality_score: number; // 1-10
}

// ============= MODULAR OUTFIT (retail-ready) =============

export type GarmentSuperCategory = 'upper' | 'lower' | 'outerwear' | 'footwear';

export interface GarmentModule {
  super_category: GarmentSuperCategory;
  category?: string;
  description: string;
  retailer_id?: string;
  garment?: Partial<GarmentSchema>;
}

/** Inventory-ready: upper, lower, outer, footwear */
export interface OutfitModules {
  upper: GarmentModule;
  lower: GarmentModule;
  outer?: GarmentModule;
  footwear: GarmentModule;
}

export interface OutfitModule {
  /** @deprecated use GarmentModule.super_category */
  role: 'jacket' | 'top' | 'bottom' | 'shoes' | 'extras';
  description: string;
  retailer_id?: string;
  garment?: Partial<GarmentSchema>;
}

export interface ModularOutfit {
  jacket?: OutfitModule;
  top?: OutfitModule;
  bottom?: OutfitModule;
  shoes?: OutfitModule;
  extras?: OutfitModule;
}

// ============= OUTFIT METADATA (for library entries) =============

export interface OutfitMetadata {
  outfitId: string;
  formality: FormalityLevel;
  temperature_range: [number, number];
  vibe: VibeType[];
  silhouette: SilhouetteType;
  retailer_compatibility: string[];
  /** @deprecated use modules + retailer_ids */
  modular_parts: ModularOutfit;
  /** Inventory-ready: SKU ids for this outfit */
  retailer_ids?: string[];
  /** New shape: upper, lower, outer, footwear */
  modules?: OutfitModules;
  abstract: AbstractOutfitAttributes;
}

// ============= ENGINE OUTPUT (to frontend / trend API) =============

/** Chain-of-Style: traceable score breakdown (0–1 per dimension) */
export interface ScoreBreakdown {
  body_harmony?: number;
  color_harmony?: number;
  event_appropriateness?: number;
  psychological_projection?: number;
  weather_compatibility?: number;
  user_preference_match?: number;
}

export interface ReasoningExplanation {
  summary: string;
  silhouette?: string;
  color_logic?: string;
  context_logic?: string;
}

export interface EngineOutfitResult {
  outfitId: string;
  id: number;
  label: string;
  reasoning: ReasoningExplanation;
  confidence: number;
  abstract: AbstractOutfitAttributes;
  /** Chain-of-Style transparency */
  score_breakdown?: ScoreBreakdown;
  /** Inventory-ready SKU mapping */
  retailer_ids?: string[];
}

export interface GenerateOutfitsResponse {
  success: boolean;
  intent: IntentProfile;
  outfits: EngineOutfitResult[];
  /** Optional: thinking step messages that were "simulated" */
  thinkingSteps?: string[];
}
