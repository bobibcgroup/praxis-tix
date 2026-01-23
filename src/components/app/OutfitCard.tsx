import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, User, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUser } from '@clerk/clerk-react';
import { addToFavorites, removeFromFavorites, getFavorites } from '@/lib/userService';
import type { Outfit, WardrobeItems } from '@/types/praxis';

interface OutfitCardProps {
  outfit: Outfit;
  onImageError?: () => void;
  inspirationNote?: string;
  wardrobeItems?: WardrobeItems;
  hasPhotoAnalysis?: boolean; // Whether user uploaded a photo for color analysis
  hasProportionAnalysis?: boolean; // Whether body proportions were detected
  hasFaceAnalysis?: boolean; // Whether face shape was detected
}

// "Why this works" explanations based on tier
const getWhyBullets = (label: string): string[] => {
  if (label === 'Safest choice') {
    return [
      'Fits the formality of the event',
      'Balanced between sharp and comfortable',
    ];
  }
  if (label === 'Sharper choice') {
    return [
      'Adds intentional polish',
      'Works well when you want to stand out',
    ];
  }
  return [
    'Prioritizes comfort without looking casual',
    'Good fit for relaxed settings',
  ];
};

// Generate stylist explanation based on uploaded items
const getStylistExplanation = (wardrobeItems?: WardrobeItems): string | null => {
  if (!wardrobeItems) return null;
  
  const hasTop = wardrobeItems.top !== null && wardrobeItems.top !== undefined;
  const hasJacket = wardrobeItems.jacket !== null && wardrobeItems.jacket !== undefined;
  const hasBottom = wardrobeItems.bottom !== null && wardrobeItems.bottom !== undefined;
  const hasShoes = wardrobeItems.shoes !== null && wardrobeItems.shoes !== undefined;
  
  const uploadCount = [hasTop, hasJacket, hasBottom, hasShoes].filter(Boolean).length;
  if (uploadCount === 0) return null;

  // Multiple items
  if (uploadCount >= 3) {
    return "Your pieces set the foundation, we refined the details.";
  }
  if (uploadCount === 2) {
    if (hasTop && hasBottom) return "Your top and bottom anchor the look, accessories complete it.";
    if (hasTop && hasJacket) return "Your layering is set, we balanced the rest.";
    if (hasBottom && hasShoes) return "Your lower half is locked, we matched the tone above.";
    return "Built around your pieces to keep everything cohesive.";
  }

  // Single item explanations
  if (hasJacket) return "Styled around your jacket to keep proportions sharp.";
  if (hasShoes) return "Built around your shoes for balance and contrast.";
  if (hasTop) return "Your top sets the tone, so we kept the rest minimal.";
  if (hasBottom) return "Your bottom anchors the silhouette, we built up from there.";
  
  return null;
};

// Image type for carousel
interface CarouselImage {
  src: string;
  alt: string;
  isUserPiece: boolean;
  label?: string;
}

const OutfitCard = ({ outfit, onImageError, inspirationNote, wardrobeItems, hasPhotoAnalysis = false, hasProportionAnalysis = false, hasFaceAnalysis = false }: OutfitCardProps) => {
  const { user } = useUser();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Check if outfit is favorited
  useEffect(() => {
    const checkFavorite = async () => {
      if (user) {
        try {
          const favorites = await getFavorites(user.id);
          setIsFavorited(favorites.includes(outfit.id));
        } catch (error) {
          console.error('Error checking favorite:', error);
        }
      }
    };
    checkFavorite();
  }, [user, outfit.id]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.info('Sign in to save favorites');
      return;
    }

    try {
      if (isFavorited) {
        await removeFromFavorites(user.id, outfit.id);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await addToFavorites(user.id, outfit.id);
        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${outfit.title} - Praxis`,
        text: `Check out this outfit recommendation: ${outfit.title}\n\n${outfit.items.top}\n${outfit.items.bottom}\n${outfit.items.shoes}\n\n${outfit.reason}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`
        );
        toast.success('Outfit details copied to clipboard');
      }
    } catch (err) {
      // User cancelled or error
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  // Build carousel images: user pieces first, then outfit image
  const carouselImages = useMemo<CarouselImage[]>(() => {
    const images: CarouselImage[] = [];
    
    // Add uploaded wardrobe items first
    if (wardrobeItems?.top) {
      images.push({ src: wardrobeItems.top, alt: 'Your top', isUserPiece: true, label: 'Top' });
    }
    if (wardrobeItems?.jacket) {
      images.push({ src: wardrobeItems.jacket, alt: 'Your jacket', isUserPiece: true, label: 'Layer' });
    }
    if (wardrobeItems?.bottom) {
      images.push({ src: wardrobeItems.bottom, alt: 'Your bottom', isUserPiece: true, label: 'Bottom' });
    }
    if (wardrobeItems?.shoes) {
      images.push({ src: wardrobeItems.shoes, alt: 'Your shoes', isUserPiece: true, label: 'Shoes' });
    }
    
    // Add outfit image last
    images.push({ src: outfit.imageUrl, alt: outfit.title, isUserPiece: false });
    
    return images;
  }, [wardrobeItems, outfit.imageUrl, outfit.title]);

  const hasMultipleImages = carouselImages.length > 1;

  // Check which items are from user's wardrobe for text badges
  const isUserPiece = {
    top: wardrobeItems?.top !== null && wardrobeItems?.top !== undefined,
    bottom: wardrobeItems?.bottom !== null && wardrobeItems?.bottom !== undefined,
    shoes: wardrobeItems?.shoes !== null && wardrobeItems?.shoes !== undefined,
  };

  const stylistExplanation = getStylistExplanation(wardrobeItems);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    onImageError?.();
  }, [onImageError]);

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  }, [carouselImages.length]);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
  }, [carouselImages.length]);

  const getLabelStyle = (label: string) => {
    if (label === 'Safest choice') {
      return 'bg-primary text-primary-foreground';
    }
    if (label === 'Sharper choice') {
      return 'bg-foreground/10 text-foreground';
    }
    return 'bg-muted text-muted-foreground';
  };

  if (imageError) {
    return null;
  }

  const whyBullets = getWhyBullets(outfit.label);
  const currentImage = carouselImages[currentImageIndex];

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image Carousel */}
        <div className="w-full md:w-56 aspect-[3/4] md:aspect-auto md:h-72 relative bg-muted shrink-0">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          <img 
            src={currentImage.src} 
            alt={currentImage.alt}
            className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Outfit tier label - only show on outfit image */}
          {!currentImage.isUserPiece && (
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getLabelStyle(outfit.label)}`}>
                {outfit.label}
              </span>
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart 
                    className={`w-4 h-4 ${isFavorited ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                  />
                </button>
              )}
            </div>
          )}

          {/* "Your piece" badge - only show on user uploaded items */}
          {currentImage.isUserPiece && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                <User className="w-3 h-3" />
                Your piece
              </span>
            </div>
          )}

          {/* Carousel navigation */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === currentImageIndex 
                        ? 'bg-white' 
                        : 'bg-white/50'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Outfit Details */}
        <div className="p-4 flex-1 flex flex-col justify-center">
          <h3 className="text-lg font-medium text-foreground mb-3">
            {outfit.title}
          </h3>

          <div className="space-y-1.5 text-sm mb-3">
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground w-16 shrink-0">Top</span>
              <span className="text-foreground flex-1">{outfit.items.top}</span>
              {isUserPiece.top && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <User className="w-3 h-3" />
                  Yours
                </span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground w-16 shrink-0">Bottom</span>
              <span className="text-foreground flex-1">{outfit.items.bottom}</span>
              {isUserPiece.bottom && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <User className="w-3 h-3" />
                  Yours
                </span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground w-16 shrink-0">Shoes</span>
              <span className="text-foreground flex-1">{outfit.items.shoes}</span>
              {isUserPiece.shoes && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <User className="w-3 h-3" />
                  Yours
                </span>
              )}
            </div>
            {outfit.items.extras && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-16 shrink-0">Extras</span>
                <span className="text-foreground">{outfit.items.extras}</span>
              </div>
            )}
          </div>

          {/* Stylist explanation for uploaded items */}
          {stylistExplanation && (
            <p className="text-sm text-primary font-medium mb-3">
              {stylistExplanation}
            </p>
          )}

          {/* Styling complement lines when photo analysis was done */}
          {hasPhotoAnalysis && !stylistExplanation && (
            <div className="mb-3 space-y-1">
              <p className="text-sm text-muted-foreground italic">
                Chosen to complement your coloring.
              </p>
              {hasProportionAnalysis && (
                <p className="text-sm text-muted-foreground italic">
                  Balanced for your proportions.
                </p>
              )}
              {hasFaceAnalysis && (
                <p className="text-sm text-muted-foreground italic">
                  Refined to suit your features.
                </p>
              )}
            </div>
          )}

          {/* Tappable reason with expandable "Why this works" */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowWhy(!showWhy);
            }}
            className="text-left w-full group"
          >
            <div className="flex items-start gap-2">
              <p className="text-muted-foreground text-sm flex-1 line-clamp-2">
                {outfit.reason}
              </p>
              <span className="text-muted-foreground/60 mt-0.5 shrink-0">
                {showWhy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </div>
          </button>

          {/* Expanded "Why this works" bullets */}
          {showWhy && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Why this works</p>
              <ul className="space-y-1.5">
                {whyBullets.map((bullet, index) => (
                  <li key={index} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Inspiration note */}
          {inspirationNote && (
            <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground italic">
              {inspirationNote}
            </p>
          )}

          {/* Share button - secondary action, icon only */}
          <div className="mt-3 pt-3 border-t border-border">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Share this look"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutfitCard;
