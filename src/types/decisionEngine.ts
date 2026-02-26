/**
 * Decision Engine types: Intent, abstract attributes, garment schema.
 * Aligns with Main targets: AI-shaped infrastructure, mapping layer, retailer readiness.
 */

// ============= INTENT (user inputs → structured) =============

export type FormalityLevel = 'low' | 'medium' | 'high';
export type TemperatureContext = 'cool' | 'mild' | 'hot';
export type VibeType = 'sharp' | 'comfort' | 'relaxed' | 'classic' | 'expressive';
export type RiskAppetite = 'low' | 'medium' | 'high';

export interface IntentProfile {
  /** From flow: occasion (event) */
  occasion: string;
  /** Derived or from flow: formality */
  formality: FormalityLevel;
  /** Weather/context: cool/mild/hot */
  temperature: TemperatureContext;
  /** Vibe: sharp, comfort, relaxed, classic, expressive */
  vibe: VibeType;
  /** Risk: low = safest, high = bolder */
  risk: RiskAppetite;
  /** Location from context */
  location?: string;
  /** Time of day */
  when?: string;
  /** Setting: indoor/outdoor/both */
  setting?: string;
  /** Budget vibe */
  budget?: string;
  /** Priority from preferences */
  priority?: string;
  /** Optional constraints (e.g. heat_management) */
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

export interface OutfitModule {
  /** e.g. jacket, pants, shoes */
  role: 'jacket' | 'top' | 'bottom' | 'shoes' | 'extras';
  description: string;
  /** Inventory placeholder for retailer integration */
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
  /** Same as OutfitEntry.id */
  outfitId: string;
  formality: FormalityLevel;
  temperature_range: [number, number]; // celsius, e.g. [15, 30]
  vibe: VibeType[];
  silhouette: SilhouetteType;
  retailer_compatibility: string[];
  /** Modular parts for retailer mapping */
  modular_parts: ModularOutfit;
  /** Abstract attributes for mapping engine */
  abstract: AbstractOutfitAttributes;
}

// ============= ENGINE OUTPUT (to frontend / trend API) =============

export interface ReasoningExplanation {
  summary: string;
  silhouette?: string;
  color_logic?: string;
  context_logic?: string;
}

export interface EngineOutfitResult {
  /** Mapped outfit id from library (e.g. date_safest_01) */
  outfitId: string;
  /** Display id 1,2,3 */
  id: number;
  /** Label: Safest choice, etc. */
  label: string;
  /** Backend-generated reasoning (not hardcoded) */
  reasoning: ReasoningExplanation;
  /** 0-100 */
  confidence: number;
  /** Abstract attributes used for this pick */
  abstract: AbstractOutfitAttributes;
}

export interface GenerateOutfitsResponse {
  success: boolean;
  intent: IntentProfile;
  outfits: EngineOutfitResult[];
  /** Optional: thinking step messages that were "simulated" */
  thinkingSteps?: string[];
}
