import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Maximize2 } from 'lucide-react';
import OutfitCard from './OutfitCard';
import OutfitComparison from './OutfitComparison';
import type { Outfit, OccasionType, OutfitLabel } from '@/types/praxis';
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
}

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
}: StepResultsProps) => {
  const [failedOutfitIds, setFailedOutfitIds] = useState<Set<number>>(new Set());
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

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
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-medium text-foreground mb-2">
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

      {/* Outfit Stack - Vertical with selection */}
      <div className="space-y-4">
        {displayOutfits.map((outfit) => (
          <div 
            key={outfit.id}
            onClick={() => handleSelectOutfit(outfit.id)}
            className={`relative cursor-pointer transition-all rounded-xl ${
              selectedOutfitId === outfit.id 
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
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
            />
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
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
    </div>
  );
};

export default StepResults;
