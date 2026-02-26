import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import type { PersonalData, IdentityCore } from '@/types/praxis';
import {
  getRecommendedSwatches,
  getMetalRecommendations,
} from '@/lib/personalOutfitGenerator';
import { saveUserProfile } from '@/lib/userService';
import { generateStyleDNACopy } from '@/lib/styleDnaService';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { Save, Shirt, Check } from 'lucide-react';

interface StepStyleDNAProps {
  personalData: PersonalData;
  onStyleAgain: () => void;
  onBack?: () => void;
  /** When set, show "Try virtual try-on" button (optional step after DNA card) */
  onTryVirtualTryOn?: () => void;
}

const DEFAULT_SWATCHES = [
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Slate Grey', hex: '#6b7280' },
  { name: 'Burgundy', hex: '#722f37' },
  { name: 'Forest Green', hex: '#228b22' },
];
const DEFAULT_METALS = 'Silver, Gold, Rose Gold';

function getArchetypeLabel(identity: IdentityCore | undefined): string | null {
  const kibbe = identity?.kibbe;
  if (!kibbe || typeof kibbe !== 'object') return null;
  const entries = Object.entries(kibbe) as [string, number][];
  if (entries.length === 0) return null;
  const [top] = entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  return top?.[0] ?? null;
}

function getConfidencePercent(personal: PersonalData): number | undefined {
  const face = personal.faceProfile?.confidence;
  const body = personal.bodyProfile?.confidence;
  if (face != null && body != null) return Math.round((face + body) * 50);
  if (face != null) return Math.round(face * 100);
  if (body != null) return Math.round(body * 100);
  return undefined;
}

const CARD_DELAY_MS = 80;

const StepStyleDNA = ({ personalData, onStyleAgain, onBack, onTryVirtualTryOn }: StepStyleDNAProps) => {
  const { user, isLoaded } = useUser();
  const hasAutoSaved = useRef(false);
  const [dnaCopy, setDnaCopy] = useState<{
    identityPhrase: string;
    paletteReasoning: string;
    leanInto: string[];
    avoid: string[];
    closingLine: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const identity = personalData.styleDNA?.identity_core;
  const archetype = getArchetypeLabel(identity) ?? identity?.color_season ?? null;
  const confidencePercent = getConfidencePercent(personalData);

  useEffect(() => {
    let cancelled = false;
    generateStyleDNACopy({
      lifestyle: personalData.lifestyle || undefined,
      inspirationPreset: personalData.inspirationPreset || undefined,
      skinToneBucket: personalData.skinTone?.bucket,
      contrastLevel: personalData.contrastLevel,
      colorSeason: identity?.color_season,
      undertone: identity?.undertone,
      archetype: archetype ?? undefined,
      verticalLine: identity?.vertical_line,
      shoulder: identity?.shoulder,
      confidencePercent,
    })
      .then((r) => {
        if (!cancelled) {
          setDnaCopy({
            identityPhrase: r.identityPhrase,
            paletteReasoning: r.paletteReasoning,
            leanInto: r.leanInto,
            avoid: r.avoid,
            closingLine: r.closingLine,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDnaCopy({
            identityPhrase: 'Understated. Refined. Effortless.',
            paletteReasoning: 'Balanced tones that enhance your natural contrast and complexion.',
            leanInto: ['Balanced warm and cool tones', 'Medium-contrast outfits that feel grounded', 'Jewel tones for structure and emphasis'],
            avoid: ['Overly bright neons that overpower', 'Very pale shades that flatten contrast'],
            closingLine: 'Style is clarity. You now have yours.',
          });
        }
      });
    return () => { cancelled = true; };
  }, [
    personalData.lifestyle,
    personalData.inspirationPreset,
    personalData.skinTone?.bucket,
    personalData.contrastLevel,
    identity?.color_season,
    identity?.undertone,
    identity?.vertical_line,
    identity?.shoulder,
    archetype,
    confidencePercent,
  ]);

  const skinToneBucket = personalData.skinTone?.bucket;
  const detectedSwatches = skinToneBucket ? getRecommendedSwatches(skinToneBucket) : null;
  const colorSwatches =
    detectedSwatches?.length
      ? detectedSwatches.slice(0, 4).map((s) => ({ name: s.name, hex: s.hex }))
      : DEFAULT_SWATCHES;
  const metalRecommendation = skinToneBucket ? getMetalRecommendations(skinToneBucket) : DEFAULT_METALS;

  const showAnalysisCard =
    identity &&
    (identity.color_season || identity.kibbe || identity.undertone || identity.vertical_line || identity.shoulder);

  const handleSaveStyle = async (isAutoSave = false) => {
    if (!user) return;
    if (!personalData.lifestyle && !personalData.styleDNA) {
      if (!isAutoSave) toast.error('Please complete the style flow first');
      return;
    }
    const styleDNAForStorage = {
      colorSwatches,
      metalRecommendation,
      skinTone: personalData.skinTone,
      contrastLevel: personalData.contrastLevel,
      lifestyle: personalData.lifestyle,
      inspirationPreset: personalData.inspirationPreset,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('praxis_style_dna', JSON.stringify(styleDNAForStorage));
      const profileDataToSave: typeof personalData = {
        ...personalData,
        lifestyle: personalData.lifestyle || '',
        styleDNA:
          personalData.styleDNA ||
          (personalData.lifestyle ? { primaryStyle: 'CLASSIC_TAILORED' as any, confidence: 'medium' as any } : undefined),
      };
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        await saveUserProfile(user.id, profileDataToSave, userEmail);
        if (!isAutoSave) toast.success('Style DNA saved');
      } catch (err) {
        console.error('Error saving to database:', err);
        if (!isAutoSave) toast.error(`Could not save: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving to localStorage:', err);
      if (!isAutoSave) toast.error('Could not save your style');
    }
  };

  useEffect(() => {
    if (isLoaded && user && (personalData.styleDNA || personalData.lifestyle) && !hasAutoSaved.current) {
      hasAutoSaved.current = true;
      handleSaveStyle(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, personalData.styleDNA, personalData.lifestyle]);

  const leanInto = dnaCopy?.leanInto ?? [
    'Balanced warm and cool tones',
    'Medium-contrast outfits that feel grounded',
    'Jewel tones for structure and emphasis',
  ];
  const avoid = dnaCopy?.avoid ?? [
    'Overly bright neons that overpower',
    'Very pale shades that flatten contrast',
  ];

  const cardClass = (i: number) =>
    `rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm transition-all duration-300 ${
      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
    }`;

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      {onBack && (
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:underline transition-colors duration-200 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          Back to my outfits
        </button>
      )}

      <div className="text-center mb-2">
        <h1 className="text-2xl md:text-3xl font-medium text-foreground">Your Style DNA</h1>
      </div>
      <p className="text-sm text-muted-foreground text-center mb-8">
        This is the framework that consistently works for you.
      </p>

      {/* Identity phrase - hero card */}
      <div
        className={cardClass(0)}
        style={{ transitionDelay: `${0}ms` }}
      >
        <p className="text-2xl md:text-3xl text-foreground font-serif italic text-center font-medium">
          {dnaCopy?.identityPhrase ?? '"Understated. Refined. Effortless."'}
        </p>
      </div>

      {/* Analysis complete - biometric card */}
      {showAnalysisCard && (
        <div
          className={`mt-4 ${cardClass(1)}`}
          style={{ transitionDelay: `${CARD_DELAY_MS}ms` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Biometric</span>
            {confidencePercent != null && (
              <span className="text-xs text-muted-foreground">Confidence {confidencePercent}%</span>
            )}
          </div>
          {archetype && (
            <p className="text-sm text-foreground font-medium mb-3">
              Your bone structure and coloring suggest a <span className="capitalize">{archetype}</span> archetype.
            </p>
          )}
          <ul className="space-y-2">
            {identity.undertone && (
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Undertone {identity.undertone}</span>
              </li>
            )}
            {identity.vertical_line && (
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Vertical line {identity.vertical_line}</span>
              </li>
            )}
            {identity.shoulder && (
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Shoulder {identity.shoulder}</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Your optimal palette */}
      <div
        className={`mt-4 ${cardClass(2)}`}
        style={{ transitionDelay: `${CARD_DELAY_MS * 2}ms` }}
      >
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Your optimal palette
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {dnaCopy?.paletteReasoning ?? 'Balanced tones that enhance your natural contrast and complexion.'}
        </p>
        <div className="flex flex-wrap gap-4">
          {colorSwatches.map((swatch, index) => (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <div
                className="w-10 h-10 rounded-full border border-border shadow-sm transition-transform hover:scale-105"
                style={{ backgroundColor: swatch.hex }}
                title={swatch.name}
              />
              <span className="text-xs text-muted-foreground">{swatch.name}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Best metals: <span className="text-foreground font-medium">{metalRecommendation}</span>
        </p>
      </div>

      {/* Lean into */}
      <div
        className={`mt-4 ${cardClass(3)}`}
        style={{ transitionDelay: `${CARD_DELAY_MS * 3}ms` }}
      >
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Lean into</h2>
        <ul className="space-y-2">
          {leanInto.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Avoid */}
      <div
        className={`mt-4 ${cardClass(4)}`}
        style={{ transitionDelay: `${CARD_DELAY_MS * 4}ms` }}
      >
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Avoid</h2>
        <ul className="space-y-2">
          {avoid.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-foreground">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Closing line */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {dnaCopy?.closingLine ?? 'Style is clarity. You now have yours.'}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3">
        {isLoaded && user ? (
          <Button onClick={handleSaveStyle} variant="cta" size="lg" className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save my style
          </Button>
        ) : isLoaded ? (
          <SignInButton mode="modal">
            <Button onClick={handleSaveStyle} variant="cta" size="lg" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save my style
            </Button>
          </SignInButton>
        ) : (
          <Button variant="cta" size="lg" className="w-full" disabled>
            Loading...
          </Button>
        )}

        {onTryVirtualTryOn && (
          <Button
            onClick={onTryVirtualTryOn}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Shirt className="w-4 h-4 mr-2" />
            Try virtual try-on
          </Button>
        )}

        <Button onClick={onStyleAgain} variant="ghost" size="lg" className="w-full text-muted-foreground">
          Style me again
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        {isLoaded && user
          ? 'This profile will guide every future recommendation.'
          : isLoaded
            ? 'Sign in when you save to access your style profile across all devices.'
            : ''}
      </p>
    </div>
  );
};

export default StepStyleDNA;
