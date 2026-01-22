import type { SkinToneBucket, ContrastLevel } from '@/types/praxis';

// ============= COMPREHENSIVE SKIN TONE STYLING SYSTEM =============
// Maps each skin tone bucket to detailed color palettes, recommended colors,
// and styling guidance that correlates with industry color theory.

export interface ColorRecommendation {
  name: string;
  hex: string;
  category: 'primary' | 'accent' | 'neutral';
}

export interface SkinTonePalette {
  paletteType: 'warm' | 'cool' | 'neutral';
  undertone: string;
  description: string;
  recommended: ColorRecommendation[];
  avoid: ColorRecommendation[];
  metals: ('gold' | 'silver' | 'rose-gold' | 'bronze')[];
  fabricSuggestions: string[];
  whatWorks: string[];
  whatToAvoid: string[];
}

// Comprehensive skin tone palettes with specific hex colors
export const SKIN_TONE_PALETTES: Record<SkinToneBucket, SkinTonePalette> = {
  'very-light': {
    paletteType: 'cool',
    undertone: 'Pink or blue undertones',
    description: 'Light complexions with cool undertones benefit from deep, saturated colors that create definition.',
    recommended: [
      { name: 'Navy', hex: '#1e3a5f', category: 'primary' },
      { name: 'Charcoal', hex: '#36454f', category: 'neutral' },
      { name: 'Burgundy', hex: '#722f37', category: 'accent' },
      { name: 'Forest Green', hex: '#228b22', category: 'accent' },
      { name: 'Deep Purple', hex: '#483d8b', category: 'accent' },
      { name: 'Cool Grey', hex: '#708090', category: 'neutral' },
      { name: 'True Black', hex: '#1a1a1a', category: 'primary' },
      { name: 'Soft White', hex: '#f5f5f5', category: 'neutral' },
    ],
    avoid: [
      { name: 'Washed Beige', hex: '#d4c5b9', category: 'neutral' },
      { name: 'Pale Yellow', hex: '#fffacd', category: 'accent' },
      { name: 'Light Orange', hex: '#ffcc99', category: 'accent' },
      { name: 'Nude Pink', hex: '#e8cfc4', category: 'neutral' },
    ],
    metals: ['silver', 'rose-gold'],
    fabricSuggestions: ['Structured cotton', 'Crisp poplin', 'Smooth wool blends'],
    whatWorks: [
      'Deep, saturated colors that add definition',
      'Cool-toned neutrals like charcoal and navy',
      'High-contrast combinations for impact',
    ],
    whatToAvoid: [
      'Washed-out pastels that blend with your skin',
      'Warm beige tones that can look muddy',
    ],
  },
  
  'light': {
    paletteType: 'neutral',
    undertone: 'Balanced warm and cool undertones',
    description: 'Light skin with neutral undertones has wide versatility—both warm and cool colors work well.',
    recommended: [
      { name: 'Navy', hex: '#1e3a5f', category: 'primary' },
      { name: 'Slate Grey', hex: '#708090', category: 'neutral' },
      { name: 'Burgundy', hex: '#722f37', category: 'accent' },
      { name: 'Forest Green', hex: '#2e5d3c', category: 'accent' },
      { name: 'Dusty Blue', hex: '#6699cc', category: 'accent' },
      { name: 'Terracotta', hex: '#cc6b49', category: 'accent' },
      { name: 'Soft Black', hex: '#2d2d2d', category: 'primary' },
      { name: 'Stone', hex: '#b8b5b0', category: 'neutral' },
    ],
    avoid: [
      { name: 'Neon Yellow', hex: '#dfff00', category: 'accent' },
      { name: 'Hot Pink', hex: '#ff69b4', category: 'accent' },
      { name: 'Pale Lavender', hex: '#e6e6fa', category: 'accent' },
    ],
    metals: ['silver', 'gold', 'rose-gold'],
    fabricSuggestions: ['Oxford cotton', 'Merino wool', 'Linen blends'],
    whatWorks: [
      'Both warm and cool tones in balanced shades',
      'Medium-contrast outfits that feel grounded',
      'Jewel tones for accent pieces',
    ],
    whatToAvoid: [
      'Overly bright neons that overwhelm',
      'Very pale colors that wash you out',
    ],
  },
  
  'medium': {
    paletteType: 'warm',
    undertone: 'Golden or yellow undertones',
    description: 'Medium skin with warm undertones looks best in earthy, rich colors that complement golden tones.',
    recommended: [
      { name: 'Camel', hex: '#c19a6b', category: 'primary' },
      { name: 'Olive', hex: '#556b2f', category: 'primary' },
      { name: 'Terracotta', hex: '#cc6b49', category: 'accent' },
      { name: 'Navy', hex: '#1e3a5f', category: 'primary' },
      { name: 'Warm Brown', hex: '#6b4423', category: 'neutral' },
      { name: 'Rust', hex: '#b7410e', category: 'accent' },
      { name: 'Cream', hex: '#f5f5dc', category: 'neutral' },
      { name: 'Coral', hex: '#e07b53', category: 'accent' },
    ],
    avoid: [
      { name: 'Pale Pink', hex: '#ffc0cb', category: 'accent' },
      { name: 'Light Grey', hex: '#c0c0c0', category: 'neutral' },
      { name: 'Icy Blue', hex: '#b0e0e6', category: 'accent' },
      { name: 'Cool Lavender', hex: '#b4a7d6', category: 'accent' },
    ],
    metals: ['gold', 'bronze', 'rose-gold'],
    fabricSuggestions: ['Linen', 'Suede', 'Brushed cotton', 'Corduroy'],
    whatWorks: [
      'Warm earth tones that enhance your natural glow',
      'Rich browns, olives, and terracottas',
      'Cream and off-white over stark white',
    ],
    whatToAvoid: [
      'Cool pastels that clash with warm undertones',
      'Washed-out colors lacking saturation',
    ],
  },
  
  'tan-olive': {
    paletteType: 'warm',
    undertone: 'Olive or golden-yellow undertones',
    description: 'Olive and tan skin carries warm yellow-green undertones that pair beautifully with earthy and warm neutrals.',
    recommended: [
      { name: 'Cream', hex: '#fffdd0', category: 'neutral' },
      { name: 'Camel', hex: '#c19a6b', category: 'primary' },
      { name: 'Olive', hex: '#556b2f', category: 'primary' },
      { name: 'Navy', hex: '#1e3a5f', category: 'primary' },
      { name: 'Warm Burgundy', hex: '#7b3f3f', category: 'accent' },
      { name: 'Burnt Orange', hex: '#cc5500', category: 'accent' },
      { name: 'Khaki', hex: '#c3b091', category: 'neutral' },
      { name: 'Warm White', hex: '#faf8f0', category: 'neutral' },
    ],
    avoid: [
      { name: 'Bright Orange', hex: '#ff6600', category: 'accent' },
      { name: 'Cool Pink', hex: '#ff99cc', category: 'accent' },
      { name: 'Icy Pastels', hex: '#e0ffff', category: 'accent' },
      { name: 'Stark White', hex: '#ffffff', category: 'neutral' },
    ],
    metals: ['gold', 'bronze'],
    fabricSuggestions: ['Linen', 'Chambray', 'Soft suede', 'Natural textures'],
    whatWorks: [
      'Warm earth tones and natural shades',
      'Cream and off-white instead of bright white',
      'Rich, saturated warm colors',
    ],
    whatToAvoid: [
      'Cool-toned pastels that look ashy',
      'Bright colors that compete with your skin tone',
    ],
  },
  
  'deep': {
    paletteType: 'neutral',
    undertone: 'Can be warm, cool, or neutral',
    description: 'Deep skin tones have incredible versatility—rich jewel tones and strong neutrals create stunning contrast.',
    recommended: [
      { name: 'Cream', hex: '#fffdd0', category: 'neutral' },
      { name: 'Navy', hex: '#1e3a5f', category: 'primary' },
      { name: 'Emerald', hex: '#046307', category: 'accent' },
      { name: 'Royal Blue', hex: '#4169e1', category: 'accent' },
      { name: 'Rich Burgundy', hex: '#800020', category: 'accent' },
      { name: 'Pure White', hex: '#ffffff', category: 'neutral' },
      { name: 'Cobalt', hex: '#0047ab', category: 'accent' },
      { name: 'Magenta', hex: '#8b008b', category: 'accent' },
    ],
    avoid: [
      { name: 'Muddy Brown', hex: '#5c4033', category: 'neutral' },
      { name: 'Dull Khaki', hex: '#9a8873', category: 'neutral' },
      { name: 'Muted Olive', hex: '#6b6b47', category: 'neutral' },
    ],
    metals: ['gold', 'silver', 'bronze', 'rose-gold'],
    fabricSuggestions: ['Silk', 'Satin accents', 'Structured wool', 'Crisp cotton'],
    whatWorks: [
      'Rich jewel tones that create vibrant contrast',
      'Bright whites and creams for striking looks',
      'Bold, saturated colors that pop',
    ],
    whatToAvoid: [
      'Muddy, muted browns that lack definition',
      'Dull earth tones that blend rather than contrast',
    ],
  },
};

// Contrast level styling guidance
export interface ContrastGuidance {
  style: 'monochrome' | 'balanced' | 'high-contrast';
  description: string;
  approach: string;
  examples: string[];
}

export const CONTRAST_STYLES: Record<ContrastLevel, ContrastGuidance> = {
  'low': {
    style: 'monochrome',
    description: 'Tonal, low contrast',
    approach: 'Harmonious looks with colors in the same family',
    examples: [
      'Navy shirt with charcoal trousers',
      'Cream layers with stone accents',
      'Tone-on-tone combinations',
    ],
  },
  'medium': {
    style: 'balanced',
    description: 'Balanced contrast',
    approach: 'Moderate contrast between light and dark elements',
    examples: [
      'White shirt with navy trousers',
      'Cream knit with dark jeans',
      'Natural layering with varied tones',
    ],
  },
  'high': {
    style: 'high-contrast',
    description: 'High contrast',
    approach: 'Bold combinations of light and dark for maximum impact',
    examples: [
      'White shirt with black trousers',
      'Cream top with deep navy',
      'Sharp light-dark pairings',
    ],
  },
};

// Get comprehensive palette hint for display
export function getDetailedPaletteHint(
  skinTone?: SkinToneBucket,
  contrastLevel?: ContrastLevel
): string | null {
  if (!skinTone && !contrastLevel) {
    return null;
  }
  
  const parts: string[] = [];
  
  if (skinTone) {
    const palette = SKIN_TONE_PALETTES[skinTone];
    if (palette.paletteType === 'warm') {
      parts.push('warm earth tones');
    } else if (palette.paletteType === 'cool') {
      parts.push('cool, saturated colors');
    } else {
      parts.push('versatile jewel tones');
    }
  }
  
  if (contrastLevel) {
    const contrast = CONTRAST_STYLES[contrastLevel];
    parts.push(contrast.description);
  }
  
  return parts.length > 0 ? parts.join(', ') : null;
}

// Get top 4 recommended color swatches for UI display
export function getRecommendedSwatches(skinTone: SkinToneBucket): ColorRecommendation[] {
  const palette = SKIN_TONE_PALETTES[skinTone];
  return palette.recommended.slice(0, 4);
}

// Get colors to avoid for UI display
export function getAvoidSwatches(skinTone: SkinToneBucket): ColorRecommendation[] {
  const palette = SKIN_TONE_PALETTES[skinTone];
  return palette.avoid.slice(0, 3);
}

// Get "What works for you" based on skin tone
export function getSkinToneWhatWorks(skinTone?: SkinToneBucket): string[] | null {
  if (!skinTone) return null;
  return SKIN_TONE_PALETTES[skinTone].whatWorks;
}

// Get "What to avoid" based on skin tone
export function getSkinToneWhatToAvoid(skinTone?: SkinToneBucket): string[] | null {
  if (!skinTone) return null;
  return SKIN_TONE_PALETTES[skinTone].whatToAvoid;
}

// Get metal recommendations
export function getMetalRecommendations(skinTone: SkinToneBucket): string {
  const metals = SKIN_TONE_PALETTES[skinTone].metals;
  return metals.map(m => m.charAt(0).toUpperCase() + m.slice(1).replace('-', ' ')).join(', ');
}

// Get fabric suggestions
export function getFabricSuggestions(skinTone: SkinToneBucket): string[] {
  return SKIN_TONE_PALETTES[skinTone].fabricSuggestions;
}
