/**
 * Structured metadata for each outfit in the library.
 * Used by Decision Engine for mapping and retailer readiness.
 */

import type { OutfitMetadata, ModularOutfit, AbstractOutfitAttributes } from '@/types/decisionEngine';
import type { OccasionType } from '@/types/praxis';
import type { TierType } from '@/lib/outfitLibrary';

type OccasionTier = { occasion: OccasionType; tier: TierType };

function buildMetadata(
  outfitId: string,
  { occasion, tier }: OccasionTier,
  opts: {
    formality: OutfitMetadata['formality'];
    tempRange: [number, number];
    vibe: OutfitMetadata['vibe'];
    silhouette: OutfitMetadata['silhouette'];
    retailer: string[];
    jacket?: string;
    top: string;
    bottom: string;
    shoes: string;
    extras?: string;
  }
): OutfitMetadata {
  const abstract: AbstractOutfitAttributes = {
    formality: opts.formality,
    silhouette: opts.silhouette,
    palette: occasion === 'WORK' ? 'dark_neutrals' : occasion === 'WEDDING' ? 'dark_neutrals' : 'earth',
    fabric_weight: opts.tempRange[1] > 25 ? 'light' : 'medium',
    vibe: opts.vibe[0],
    tier,
  };
  const modular_parts: ModularOutfit = {
    ...(opts.jacket && {
      jacket: {
        role: 'jacket',
        description: opts.jacket,
        retailer_id: `demo_${outfitId}_jacket`,
      },
    }),
    top: { role: 'top', description: opts.top, retailer_id: `demo_${outfitId}_top` },
    bottom: { role: 'bottom', description: opts.bottom, retailer_id: `demo_${outfitId}_bottom` },
    shoes: { role: 'shoes', description: opts.shoes, retailer_id: `demo_${outfitId}_shoes` },
    ...(opts.extras && {
      extras: { role: 'extras', description: opts.extras, retailer_id: `demo_${outfitId}_extras` },
    }),
  };
  return {
    outfitId,
    formality: opts.formality,
    temperature_range: opts.tempRange,
    vibe: opts.vibe,
    silhouette: opts.silhouette,
    retailer_compatibility: opts.retailer,
    modular_parts,
    abstract,
  };
}

const OCCASION_TEMP: Record<string, [number, number]> = {
  DATE: [10, 32],
  WORK: [15, 28],
  DINNER: [12, 30],
  PARTY: [15, 32],
  WEDDING: [15, 35],
};

/** Metadata for every outfit in the library. Key = outfit id. */
export const OUTFIT_METADATA: Record<string, OutfitMetadata> = {
  // DATE
  date_safest_01: buildMetadata('date_safest_01', { occasion: 'DATE', tier: 'SAFEST' }, {
    formality: 'medium',
    tempRange: OCCASION_TEMP.DATE,
    vibe: ['comfort', 'relaxed'],
    silhouette: 'relaxed',
    retailer: ['casual', 'smart-casual'],
    top: 'Neutral overshirt with a plain t-shirt',
    bottom: 'Dark straight jeans',
    shoes: 'Clean white sneakers',
  }),
  date_sharper_01: buildMetadata('date_sharper_01', { occasion: 'DATE', tier: 'SHARPER' }, {
    formality: 'high',
    tempRange: OCCASION_TEMP.DATE,
    vibe: ['sharp', 'classic'],
    silhouette: 'structured',
    retailer: ['tailoring', 'smart-casual'],
    jacket: 'Navy blazer',
    top: 'Fine knit top',
    bottom: 'Tailored chinos',
    shoes: 'Loafers',
  }),
  date_relaxed_01: buildMetadata('date_relaxed_01', { occasion: 'DATE', tier: 'RELAXED' }, {
    formality: 'low',
    tempRange: OCCASION_TEMP.DATE,
    vibe: ['relaxed', 'comfort'],
    silhouette: 'relaxed',
    retailer: ['casual'],
    top: 'Plain t-shirt with a light jacket',
    bottom: 'Slim dark jeans',
    shoes: 'Casual sneakers',
  }),
  // WORK
  work_safest_01: buildMetadata('work_safest_01', { occasion: 'WORK', tier: 'SAFEST' }, {
    formality: 'high',
    tempRange: OCCASION_TEMP.WORK,
    vibe: ['sharp', 'classic'],
    silhouette: 'structured',
    retailer: ['formalwear', 'tailoring'],
    jacket: 'Navy blazer',
    top: 'Light blue shirt',
    bottom: 'Charcoal trousers',
    shoes: 'Brown oxford',
  }),
  work_sharper_01: buildMetadata('work_sharper_01', { occasion: 'WORK', tier: 'SHARPER' }, {
    formality: 'high',
    tempRange: OCCASION_TEMP.WORK,
    vibe: ['sharp', 'classic'],
    silhouette: 'structured',
    retailer: ['formalwear', 'tailoring'],
    jacket: 'Dark suit jacket',
    top: 'White shirt',
    bottom: 'Matching trousers',
    shoes: 'Black oxford',
  }),
  work_relaxed_01: buildMetadata('work_relaxed_01', { occasion: 'WORK', tier: 'RELAXED' }, {
    formality: 'medium',
    tempRange: OCCASION_TEMP.WORK,
    vibe: ['comfort', 'relaxed'],
    silhouette: 'relaxed',
    retailer: ['smart-casual', 'office'],
    top: 'Oxford shirt',
    bottom: 'Chinos',
    shoes: 'Loafers',
  }),
  // DINNER
  dinner_safest_01: buildMetadata('dinner_safest_01', { occasion: 'DINNER', tier: 'SAFEST' }, {
    formality: 'high',
    tempRange: OCCASION_TEMP.DINNER,
    vibe: ['classic', 'sharp'],
    silhouette: 'structured',
    retailer: ['tailoring', 'formalwear'],
    jacket: 'Blazer',
    top: 'Dress shirt',
    bottom: 'Trousers',
    shoes: 'Oxford',
  }),
  dinner_sharper_01: buildMetadata('dinner_sharper_01', { occasion: 'DINNER', tier: 'SHARPER' }, {
    formality: 'high',
    tempRange: OCCASION_TEMP.DINNER,
    vibe: ['sharp', 'classic'],
    silhouette: 'structured',
    retailer: ['tailoring', 'formalwear'],
    jacket: 'Suit jacket',
    top: 'Shirt',
    bottom: 'Trousers',
    shoes: 'Oxford',
  }),
  dinner_relaxed_01: buildMetadata('dinner_relaxed_01', { occasion: 'DINNER', tier: 'RELAXED' }, {
    formality: 'medium',
    tempRange: OCCASION_TEMP.DINNER,
    vibe: ['relaxed', 'comfort'],
    silhouette: 'relaxed',
    retailer: ['smart-casual'],
    top: 'Smart shirt',
    bottom: 'Dark trousers',
    shoes: 'Loafers',
  }),
  // PARTY
  party_safest_01: buildMetadata('party_safest_01', { occasion: 'PARTY', tier: 'SAFEST' }, {
    formality: 'medium',
    tempRange: OCCASION_TEMP.PARTY,
    vibe: ['sharp', 'expressive'],
    silhouette: 'fitted',
    retailer: ['nightwear', 'smart-casual'],
    top: 'Dark shirt',
    bottom: 'Slim trousers',
    shoes: 'Leather shoes',
  }),
  party_sharper_01: buildMetadata('party_sharper_01', { occasion: 'PARTY', tier: 'SHARPER' }, {
    formality: 'high',
    tempRange: OCCASION_TEMP.PARTY,
    vibe: ['sharp', 'expressive'],
    silhouette: 'structured',
    retailer: ['tailoring', 'nightwear'],
    jacket: 'Blazer',
    top: 'Shirt',
    bottom: 'Trousers',
    shoes: 'Dress shoes',
  }),
  party_relaxed_01: buildMetadata('party_relaxed_01', { occasion: 'PARTY', tier: 'RELAXED' }, {
    formality: 'low',
    tempRange: OCCASION_TEMP.PARTY,
    vibe: ['relaxed', 'comfort'],
    silhouette: 'relaxed',
    retailer: ['casual'],
    top: 'Casual top',
    bottom: 'Jeans',
    shoes: 'Sneakers',
  }),
  // WEDDING
  wedding_safest_01: buildMetadata('wedding_safest_01', { occasion: 'WEDDING', tier: 'SAFEST' }, {
    formality: 'high',
    tempRange: OCCASION_TEMP.WEDDING,
    vibe: ['classic', 'sharp'],
    silhouette: 'structured',
    retailer: ['formalwear', 'tailoring'],
    jacket: 'Navy blazer',
    top: 'Light shirt',
    bottom: 'Tailored trousers',
    shoes: 'Brown oxford',
  }),
  wedding_sharper_01: buildMetadata('wedding_sharper_01', { occasion: 'WEDDING', tier: 'SHARPER' }, {
    formality: 'high',
    tempRange: OCCASION_TEMP.WEDDING,
    vibe: ['sharp', 'classic'],
    silhouette: 'structured',
    retailer: ['formalwear', 'tailoring'],
    jacket: 'Suit',
    top: 'Shirt',
    bottom: 'Trousers',
    shoes: 'Oxford',
  }),
  wedding_relaxed_01: buildMetadata('wedding_relaxed_01', { occasion: 'WEDDING', tier: 'RELAXED' }, {
    formality: 'medium',
    tempRange: OCCASION_TEMP.WEDDING,
    vibe: ['relaxed', 'comfort'],
    silhouette: 'relaxed',
    retailer: ['smart-casual', 'tailoring'],
    jacket: 'Light blazer',
    top: 'Open-collar shirt',
    bottom: 'Tailored trousers',
    shoes: 'Loafers',
  }),
};

export function getOutfitMetadata(outfitId: string): OutfitMetadata | null {
  return OUTFIT_METADATA[outfitId] ?? null;
}
