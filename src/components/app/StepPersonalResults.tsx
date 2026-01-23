import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import OutfitCard from './OutfitCard';
import type { Outfit, PersonalData } from '@/types/praxis';
import { generateMotivationalMessage } from '@/lib/openaiService';

interface StepPersonalResultsProps {
  outfits: Outfit[];
  personalData: PersonalData;
  onRestart: () => void;
  onComplete: (selectedOutfitId: number) => void;
  onBack: () => void;
}

// Personal flow results with outfit selection
const StepPersonalResults = ({ 
  outfits,
  personalData,
  onRestart, 
  onComplete,
  onBack,
}: StepPersonalResultsProps) => {
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);

  // Generate motivational message when outfits are displayed
  useEffect(() => {
    if (outfits.length > 0) {
      const firstOutfit = outfits[0];
      generateMotivationalMessage({
        outfitLabel: firstOutfit.label,
        occasion: personalData.lifestyle || 'personal',
        mode: 'personal',
        hasPhoto: personalData.hasPhoto,
      }).then(setMotivationalMessage).catch(() => {
        // Silently fail, message is optional
      });
    }
  }, [outfits, personalData]);

  // Check if user provided any inspiration
  const hasInspirationReference = personalData.hasInspiration || 
    personalData.inspirationData || 
    personalData.inspirationPreset;

  // Check if photo analysis was done (for color complement line)
  const hasPhotoAnalysis = !!personalData.skinTone?.bucket;
  
  // Check if body proportion analysis was done
  const hasProportionAnalysis = !!personalData.bodyProportions;
  
  // Check if face shape analysis was done
  const hasFaceAnalysis = !!personalData.faceShape;

  // Build context string based on what was provided
  const getContextString = () => {
    const parts: string[] = [];
    if (personalData.hasPhoto) parts.push('your build');
    if (hasPhotoAnalysis) parts.push('coloring');
    if (personalData.lifestyle) parts.push('lifestyle');
    if (personalData.hasInspiration || personalData.inspirationPreset) parts.push('inspiration');
    if (personalData.hasWardrobe) parts.push('wardrobe');
    
    if (parts.length === 0) return 'your preferences';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
  };

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

      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-medium text-foreground mb-2">
          Choose your outfit
        </h1>
        <p className="text-sm text-muted-foreground mb-2">
          Chosen for {getContextString()}.
        </p>
        {motivationalMessage && (
          <p className="text-sm text-muted-foreground/80 italic animate-in fade-in duration-500">
            {motivationalMessage}
          </p>
        )}
      </div>

      {/* Outfit Stack - Vertical with selection */}
      <div className="space-y-4">
        {outfits.map((outfit) => (
          <div 
            key={outfit.id}
            onClick={() => handleSelectOutfit(outfit.id)}
            className={`relative cursor-pointer transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
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
              inspirationNote={hasInspirationReference ? "Inspired by your reference style." : undefined}
              wardrobeItems={personalData.wardrobeItems}
              hasPhotoAnalysis={hasPhotoAnalysis}
              hasProportionAnalysis={hasProportionAnalysis}
              hasFaceAnalysis={hasFaceAnalysis}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
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
    </div>
  );
};

export default StepPersonalResults;
