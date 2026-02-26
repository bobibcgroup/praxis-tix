import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Maximize2, Calendar, SlidersHorizontal, Sparkles, Share2, ThumbsUp, ThumbsDown, RefreshCw, List } from 'lucide-react';
import OutfitCard from './OutfitCard';
import OutfitComparison from './OutfitComparison';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Outfit, OccasionType, OutfitLabel } from '@/types/praxis';
import type { FlowData } from '@/types/praxis';
import { getValidOutfits, getTierLabel, type TierType } from '@/lib/outfitLibrary';
import { generateMotivationalMessage } from '@/lib/openaiService';

interface StepResultsProps {
  outfits: Outfit[];
  occasion: OccasionType;
  onRestart: () => void;
  onShowAlternatives: () => void;
  hasAlternatives: boolean;
  onComplete: (selectedOutfitId: number) => void;
  onBack: () => void;
  /** When true, show loading state (trend research + image generation) instead of cards */
  loading?: boolean;
  /** Quick flow: pass for replace one / more options / save all / share */
  flowData?: FlowData;
  usedLibraryIds?: string[];
  onReplaceOne?: (tier: TierType) => void;
  onGetAlternativesForTier?: (tier: TierType) => Outfit[];
  onReplaceWithOutfit?: (tier: TierType, outfit: Outfit) => void;
  onSaveAllThree?: () => void | Promise<void>;
  onShareResults?: () => void | Promise<void>;
  eventDate?: string;
  lookName?: string;
  onUpdateOccasion?: (updates: { eventDate?: string; lookName?: string }) => void;
}

const THINKING_STEPS = [
  'Analyzing event context…',
  'Balancing formality and comfort…',
  'Selecting optimal silhouettes…',
];

/** Same card-of-tasks design as Build my DNA loading (StepPersonalLoading) */
const PROCESS_STEPS = [
  { id: 'context', label: 'Analyzing event context…', icon: Calendar },
  { id: 'balance', label: 'Balancing formality and comfort…', icon: SlidersHorizontal },
  { id: 'silhouettes', label: 'Selecting optimal silhouettes…', icon: Sparkles },
];

// ============= RESULTS SCREEN =============
// CRITICAL: Outfits are from locked library only.
// Image and text always come from the same outfit object.
// No dynamic text generation.
const StepResults = ({ 
  outfits: initialOutfits, 
  occasion, 
  onRestart, 
  onShowAlternatives,
  hasAlternatives,
  onComplete,
  onBack,
  loading = false,
  flowData,
  usedLibraryIds = [],
  onReplaceOne,
  onGetAlternativesForTier,
  onReplaceWithOutfit,
  onSaveAllThree,
  onShareResults,
  eventDate,
  lookName,
  onUpdateOccasion,
}: StepResultsProps) => {
  const [failedOutfitIds, setFailedOutfitIds] = useState<Set<number>>(new Set());
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);
  const [alternativesSheetOpen, setAlternativesSheetOpen] = useState(false);
  const [alternativesTier, setAlternativesTier] = useState<TierType | null>(null);
  const [alternativesList, setAlternativesList] = useState<Outfit[]>([]);
  const showResultsActions = Boolean(onReplaceOne && onGetAlternativesForTier && onReplaceWithOutfit);

  // Optional: cycle step highlight (kept for any future use; card shows all steps)
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => {
      setThinkingStepIndex((i) => (i + 1) % PROCESS_STEPS.length);
    }, 1000);
    return () => clearInterval(t);
  }, [loading]);

  // Generate motivational message when outfits are displayed
  useEffect(() => {
    if (initialOutfits.length > 0) {
      const firstOutfit = initialOutfits[0];
      generateMotivationalMessage({
        outfitLabel: firstOutfit.label,
        occasion,
        mode: 'quick',
      }).then(setMotivationalMessage).catch(() => {
        // Silently fail, message is optional
      });
    }
  }, [initialOutfits, occasion]);

  // Get fallback outfits from same occasion when image fails
  const getFallbackOutfit = useCallback((tier: TierType, excludeIds: string[]): Outfit | null => {
    const allOccasionOutfits = getValidOutfits().filter(
      o => o.occasion === occasion && o.tier === tier && !excludeIds.includes(o.id)
    );
    
    if (allOccasionOutfits.length === 0) return null;
    
    const entry = allOccasionOutfits[0];
    return {
      id: Date.now(), // Unique ID for React key
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
  }, [occasion]);

  // Map label back to tier
  const labelToTier = (label: OutfitLabel): TierType => {
    if (label === 'Safest choice') return 'SAFEST';
    if (label === 'Sharper choice') return 'SHARPER';
    return 'RELAXED';
  };

  // Handle image load failure - mark outfit as failed
  const handleImageError = useCallback((outfitId: number) => {
    setFailedOutfitIds(prev => new Set(prev).add(outfitId));
  }, []);

  // Filter out failed outfits and attempt replacements
  const displayOutfits = useMemo(() => {
    const result: Outfit[] = [];
    const usedIds: string[] = [];

    for (const outfit of initialOutfits) {
      if (failedOutfitIds.has(outfit.id)) {
        // Try to find a fallback
        const tier = labelToTier(outfit.label);
        const fallback = getFallbackOutfit(tier, usedIds);
        if (fallback) {
          result.push(fallback);
          // Track used IDs to avoid duplicates
        }
      } else {
        result.push(outfit);
      }
    }

    return result;
  }, [initialOutfits, failedOutfitIds, getFallbackOutfit]);

  const handleSelectOutfit = (outfitId: number) => {
    setSelectedOutfitId(outfitId);
  };

  const handleConfirmSelection = () => {
    if (selectedOutfitId !== null) {
      onComplete(selectedOutfitId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {loading ? (
        <>
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-medium text-foreground mb-2">
              Styling your moment…
            </h1>
            <p className="text-sm text-muted-foreground">
              Finding the best options for this occasion.
            </p>
          </div>
          {/* Same card-of-tasks design as Build my DNA loading (StepPersonalLoading) */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Processing
              </span>
            </div>
            <ul className="space-y-4">
              {PROCESS_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === thinkingStepIndex;
                return (
                  <li
                    key={step.id}
                    className="flex items-start gap-3 animate-fade-in"
                    style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{step.label}</p>
                    </div>
                    {isActive && (
                      <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" />
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              This usually takes a few seconds. Feel free to stay on this screen.
            </p>
          </div>
          <div className="mt-8 flex justify-center">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          </div>
        </>
      ) : (
        <>
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-medium text-foreground mb-2">
          Choose your outfit
        </h1>
        <p className="text-sm text-muted-foreground mb-2">
          Tap the one that feels right.
        </p>
        {motivationalMessage && (
          <p className="text-sm text-muted-foreground/80 italic animate-in fade-in duration-500">
            {motivationalMessage}
          </p>
        )}
      </div>

      {/* Optional: Name this look / When is it? */}
      {onUpdateOccasion && (
        <div className="mb-4 p-4 rounded-xl border border-border bg-muted/30 space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Name this look (optional)</label>
          <input
            type="text"
            placeholder="e.g. Interview Tuesday"
            value={lookName ?? ''}
            onChange={(e) => onUpdateOccasion({ lookName: e.target.value || undefined })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <label className="text-xs font-medium text-muted-foreground">When is it? (optional)</label>
          <input
            type="date"
            value={eventDate ?? ''}
            onChange={(e) => onUpdateOccasion({ eventDate: e.target.value || undefined })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      )}
      {/* Outfit Stack - Always stacked */}
      <div className="space-y-4">
        {displayOutfits.map((outfit, index) => (
          <div 
            key={outfit.id}
            onClick={() => handleSelectOutfit(outfit.id)}
            className={`relative cursor-pointer transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              selectedOutfitId === outfit.id 
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                : index === 0 
                  ? 'ring-1 ring-primary/30' // Emphasize top recommendation
                  : 'hover:ring-1 hover:ring-border'
            }`}
          >
            {selectedOutfitId === outfit.id && (
              <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <OutfitCard 
              outfit={outfit} 
              onImageError={() => handleImageError(outfit.id)}
              isFirstRecommendation={index === 0}
              showResultsActions={showResultsActions}
              tier={labelToTier(outfit.label)}
              onSwapThisOne={onReplaceOne}
              onMoreOptions={
                onGetAlternativesForTier && onReplaceWithOutfit
                  ? (t) => {
                      const list = onGetAlternativesForTier(t);
                      setAlternativesList(list);
                      setAlternativesTier(t);
                      setAlternativesSheetOpen(true);
                    }
                  : undefined
              }
              onFeedback={undefined}
              retailerIds={outfit.retailer_ids}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {onSaveAllThree && (
          <Button onClick={onSaveAllThree} variant="outline" size="lg" className="w-full">
            Save all three to history
          </Button>
        )}
        {onShareResults && (
          <Button onClick={onShareResults} variant="outline" size="lg" className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Share my looks
          </Button>
        )}
        {displayOutfits.length > 1 && (
          <Button 
            onClick={() => setShowComparison(true)} 
            variant="outline" 
            size="lg"
            className="w-full"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Compare outfits
          </Button>
        )}
        <Button 
          onClick={onShowAlternatives} 
          variant="outline" 
          size="lg"
          className="w-full"
          disabled={!hasAlternatives}
        >
          Show alternatives
        </Button>
        <Button 
          onClick={handleConfirmSelection}
          variant="cta"
          size="lg"
          className="w-full"
          disabled={selectedOutfitId === null}
        >
          {selectedOutfitId === null ? 'Select an outfit' : 'Choose this look'}
        </Button>
      </div>

      {showComparison && (
        <OutfitComparison
          outfits={displayOutfits}
          onSelect={(outfitId) => {
            setSelectedOutfitId(outfitId);
            setShowComparison(false);
          }}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* More options sheet: pick one alternative for this tier */}
      <Sheet open={alternativesSheetOpen} onOpenChange={setAlternativesSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>More options for this look</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {alternativesList.map((alt) => (
              <div
                key={alt.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  if (alternativesTier && onReplaceWithOutfit) {
                    onReplaceWithOutfit(alternativesTier, alt);
                    setAlternativesSheetOpen(false);
                  }
                }}
              >
                <img src={alt.imageUrl} alt={alt.title} className="w-16 h-20 object-cover rounded" />
                <div>
                  <p className="font-medium">{alt.title}</p>
                  <p className="text-sm text-muted-foreground">{alt.reason}</p>
                </div>
              </div>
            ))}
            {alternativesList.length === 0 && (
              <p className="text-sm text-muted-foreground">No other options for this tier right now.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
        </>
      )}
    </div>
  );
};

export default StepResults;
