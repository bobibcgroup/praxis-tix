import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StyleCardCarouselProps {
  images: string[];
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

const StyleCardCarousel = ({ images, label, isSelected, onSelect }: StyleCardCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left - next
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      } else {
        // Swipe right - prev
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    }
    setTouchStart(null);
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-300 group",
        isSelected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02] shadow-lg shadow-primary/10"
          : "hover:ring-1 hover:ring-primary/40 hover:shadow-md"
      )}
    >
      {/* Image container with swipe support */}
      <div 
        className="aspect-[3/4] relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Images */}
        <div 
          className="flex transition-transform duration-300 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, idx) => (
            <img
              key={idx}
              src={image}
              alt={`${label} style ${idx + 1}`}
              className={cn(
                "w-full h-full object-cover flex-shrink-0 transition-transform duration-300",
                isSelected ? "scale-105" : ""
              )}
              loading="lazy"
            />
          ))}
        </div>
        
        {/* Gradient overlay for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        
        {/* Navigation arrows - subtle, desktop only */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background/80"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background/80"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </>
        )}
        
        {/* Dot indicators - subtle */}
        {images.length > 1 && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                  idx === currentIndex 
                    ? "bg-white w-3" 
                    : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}
        
        {/* Label */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
          <span className="text-white font-medium text-sm drop-shadow-lg">
            {label}
          </span>
        </div>
      </div>
    </button>
  );
};

export default StyleCardCarousel;
