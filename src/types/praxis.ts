// ============= STRICT ENUMS =============

// Flow Mode
export type FlowMode = 'quick' | 'personal';

// Occasion
export type OccasionType = 'WEDDING' | 'WORK' | 'DINNER' | 'DATE' | 'PARTY';

// Location (expanded)
export type LocationType = 
  | 'RESTAURANT' 
  | 'OFFICE' 
  | 'HOTEL' 
  | 'OUTDOOR_VENUE' 
  | 'HOME'
  | 'BAR'
  | 'CLUB'
  | 'MEETING'
  | 'CONFERENCE'
  | 'BEACH_RESORT'
  | 'GARDEN'
  | 'PRIVATE_ESTATE';

// Time of day
export type TimeType = 'DAY' | 'NIGHT';

// Setting
export type SettingType = 'INDOOR' | 'OUTDOOR' | 'BOTH';

// Priority
export type PriorityType = 'SHARP' | 'COMFORT' | 'IMPRESSION' | 'SIMPLE';

// Budget
export type BudgetType = 'EVERYDAY' | 'MID_RANGE' | 'PREMIUM';

// Lifestyle (personal flow)
export type LifestyleType = 'WORK' | 'SOCIAL' | 'CASUAL' | 'MIXED';

// Inspiration Style Presets
export type InspirationPresetType = 
  | 'QUIET_LUXURY' 
  | 'SMART_CASUAL' 
  | 'MODERN_MINIMAL' 
  | 'ELEVATED_STREET' 
  | 'CLASSIC_TAILORED' 
  | 'RELAXED_WEEKEND';

// ============= DATA STRUCTURES =============

export interface OccasionData {
  event: OccasionType | '';
}

export interface ContextData {
  location: LocationType | '';
  when: TimeType | '';
  setting: SettingType | '';
}

export interface PreferencesData {
  priority: PriorityType | '';
  budget: BudgetType | '';
}

// Style DNA - long-term style anchor
export interface StyleDNA {
  primaryStyle: InspirationPresetType;
  secondaryStyle?: InspirationPresetType;
  confidence: 'high' | 'medium' | 'low';
}

// Skin tone detection
export type SkinToneBucket = 'very-light' | 'light' | 'medium' | 'tan-olive' | 'deep';

export interface SkinToneData {
  bucket: SkinToneBucket;
  hex: string;
}

// Contrast level detection
export type ContrastLevel = 'low' | 'medium' | 'high';

// Style color profile (derived from photo analysis)
export type PaletteType = 'warm' | 'cool' | 'neutral';

export interface StyleColorProfile {
  palette: PaletteType;
  contrast: ContrastLevel;
}

// Body proportion types
export type ShoulderWidth = 'narrow' | 'average' | 'broad';
export type TorsoLength = 'short' | 'balanced' | 'long';
export type LegLength = 'short' | 'balanced' | 'long';
export type BuildType = 'lean' | 'average' | 'solid';

export interface BodyProportions {
  shoulders: ShoulderWidth;
  torso: TorsoLength;
  legs: LegLength;
  build: BuildType;
}

// Face shape types
export type FaceShape = 'oval' | 'round' | 'square' | 'long';

export interface FaceShapeData {
  shape: FaceShape;
  confidence: 'high' | 'medium' | 'low';
}

// Fit calibration types
export type HeightUnit = 'cm' | 'ft-in';
export type FitPreference = 'slim' | 'regular' | 'relaxed';

export interface FitCalibration {
  height?: number; // Always stored in cm
  heightUnit: HeightUnit;
  fitPreference?: FitPreference;
}

// Wardrobe items structure
export interface WardrobeItems {
  top: string | null;
  jacket: string | null;
  bottom: string | null;
  shoes: string | null;
}

export interface PersonalData {
  hasPhoto: boolean;
  photoOriginal?: string; // Original uncropped photo
  photoData?: string; // Base64 encoded image data (legacy, use photoCropped)
  photoCropped?: string; // Cropped version for styling
  skinTone?: SkinToneData; // Detected skin tone
  contrastLevel?: ContrastLevel; // Detected contrast level
  styleColorProfile?: StyleColorProfile; // Derived color profile for styling
  bodyProportions?: BodyProportions; // Detected body proportions
  faceShape?: FaceShapeData; // Detected face shape
  fitCalibration?: FitCalibration; // Height and fit preference
  lifestyle: LifestyleType | '';
  hasInspiration: boolean;
  inspirationData?: string; // Base64 encoded image data
  inspirationPreset?: InspirationPresetType; // Selected style preset
  styleDirectionImages?: string[]; // Image URLs/identifiers for the selected style
  styleDNA?: StyleDNA; // Style DNA anchor
  hasWardrobe: boolean;
  wardrobeItems?: WardrobeItems; // Structured wardrobe uploads
}

// Lifestyle usage tracking (stored in localStorage)
export interface LifestyleUsageData {
  occasionCounts: Record<string, number>;
  lastUpdated: string;
}

export interface FlowData {
  occasion: OccasionData;
  context: ContextData;
  preferences: PreferencesData;
}

export interface PersonalFlowData {
  personal: PersonalData;
}

// ============= RESULT LABELS =============

export type OutfitLabel = 'Safest choice' | 'Sharper choice' | 'More relaxed choice' | 'Best for you' | 'More expressive' | 'More relaxed';

// ============= OUTFIT STRUCTURE (UI) =============

export interface Outfit {
  id: number;
  title: string;
  label: OutfitLabel;
  items: {
    top: string;
    bottom: string;
    shoes: string;
    extras?: string;
  };
  reason: string;
  imageUrl: string;
}
