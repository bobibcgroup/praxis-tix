import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Outfit } from '@/types/praxis';
import OutfitCard from './OutfitCard';

interface OutfitComparisonProps {
  outfits: Outfit[];
  onSelect: (outfitId: number) => void;
  onClose: () => void;
}

const OutfitComparison = ({ outfits, onSelect, onClose }: OutfitComparisonProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (outfits.length === 0) return null;

  const currentOutfit = outfits[currentIndex];
  const hasMultiple = outfits.length > 1;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? outfits.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === outfits.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Compare Outfits</h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            {/* Navigation */}
            {hasMultiple && (
              <div className="flex items-center justify-between mb-4">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {outfits.length}
                </span>
                <Button
                  onClick={handleNext}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Current Outfit */}
            <div className="mb-6">
              <OutfitCard outfit={currentOutfit} />
            </div>

            {/* All Outfits Grid (if multiple) */}
            {hasMultiple && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {outfits.map((outfit, index) => (
                  <button
                    key={outfit.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={outfit.imageUrl}
                      alt={outfit.title}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white font-medium truncate">
                        {outfit.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline" size="lg" className="flex-1">
                Close
              </Button>
              <Button
                onClick={() => onSelect(currentOutfit.id)}
                variant="cta"
                size="lg"
                className="flex-[2]"
              >
                Choose this look
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutfitComparison;
