import { useState, useRef, useCallback } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlowStep from './FlowStep';
import StyleCardCarousel from './StyleCardCarousel';
import type { InspirationPresetType, StyleDNA } from '@/types/praxis';

// Import style images - each style has 3 images
import quietLuxuryImg1 from '@/assets/styles/quiet-luxury.jpg';
import quietLuxuryImg2 from '@/assets/styles/quiet-luxury-2.jpg';
import quietLuxuryImg3 from '@/assets/styles/quiet-luxury-3.jpg';
import smartCasualImg1 from '@/assets/styles/smart-casual.jpg';
import smartCasualImg2 from '@/assets/styles/smart-casual-2.jpg';
import smartCasualImg3 from '@/assets/styles/smart-casual-3.jpg';
import modernMinimalImg1 from '@/assets/styles/modern-minimal.jpg';
import modernMinimalImg2 from '@/assets/styles/modern-minimal-2.jpg';
import modernMinimalImg3 from '@/assets/styles/modern-minimal-3.jpg';
import elevatedStreetImg1 from '@/assets/styles/elevated-street.jpg';
import elevatedStreetImg2 from '@/assets/styles/elevated-street-2.jpg';
import elevatedStreetImg3 from '@/assets/styles/elevated-street-3.jpg';
import classicTailoredImg1 from '@/assets/styles/classic-tailored.jpg';
import classicTailoredImg2 from '@/assets/styles/classic-tailored-2.jpg';
import classicTailoredImg3 from '@/assets/styles/classic-tailored-3.jpg';
import relaxedWeekendImg1 from '@/assets/styles/relaxed-weekend.jpg';
import relaxedWeekendImg2 from '@/assets/styles/relaxed-weekend-2.jpg';
import relaxedWeekendImg3 from '@/assets/styles/relaxed-weekend-3.jpg';

interface StylePreset {
  value: InspirationPresetType;
  label: string;
  images: string[];
}

const STYLE_PRESETS: StylePreset[] = [
  { 
    value: 'QUIET_LUXURY', 
    label: 'Quiet luxury', 
    images: [quietLuxuryImg1, quietLuxuryImg2, quietLuxuryImg3]
  },
  { 
    value: 'SMART_CASUAL', 
    label: 'Smart casual', 
    images: [smartCasualImg1, smartCasualImg2, smartCasualImg3]
  },
  { 
    value: 'MODERN_MINIMAL', 
    label: 'Modern minimal', 
    images: [modernMinimalImg1, modernMinimalImg2, modernMinimalImg3]
  },
  { 
    value: 'ELEVATED_STREET', 
    label: 'Elevated street', 
    images: [elevatedStreetImg1, elevatedStreetImg2, elevatedStreetImg3]
  },
  { 
    value: 'CLASSIC_TAILORED', 
    label: 'Classic tailored', 
    images: [classicTailoredImg1, classicTailoredImg2, classicTailoredImg3]
  },
  { 
    value: 'RELAXED_WEEKEND', 
    label: 'Relaxed weekend', 
    images: [relaxedWeekendImg1, relaxedWeekendImg2, relaxedWeekendImg3]
  },
];

interface StepInspirationProps {
  onInspirationPhoto: (photoData: string) => void;
  onInspirationPreset: (preset: InspirationPresetType, images: string[], styleDNA: StyleDNA) => void;
  onSkip: () => void;
  onBack: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const StepInspiration = ({ onInspirationPhoto, onInspirationPreset, onSkip, onBack }: StepInspirationProps) => {
  const [view, setView] = useState<'options' | 'preview' | 'presets'>('options');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<InspirationPresetType | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
      setView('preview');
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
  }, []);

  const handleUploadClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleConfirmPhoto = () => {
    if (photoPreview) {
      onInspirationPhoto(photoPreview);
    }
  };

  const handleChangePhoto = () => {
    setPhotoPreview(null);
    setView('options');
  };

  const handleConfirmPreset = () => {
    if (selectedPreset) {
      const selectedStyle = STYLE_PRESETS.find(p => p.value === selectedPreset);
      if (selectedStyle) {
        // Build Style DNA anchor
        const styleDNA: StyleDNA = {
          primaryStyle: selectedPreset,
          confidence: 'high'
        };
        
        onInspirationPreset(selectedPreset, selectedStyle.images, styleDNA);
      }
    }
  };

  const handleClosePresets = () => {
    setSelectedPreset(null);
    setView('options');
  };

  // Get thumbnail images for mini preview (first image of first 4 styles)
  const thumbnailImages = STYLE_PRESETS.slice(0, 4).map(p => p.images[0]);

  // Photo preview view
  if (view === 'preview' && photoPreview) {
    return (
      <FlowStep 
        title="Show us a look you like (optional)"
        subtitle="We'll match the vibe while keeping it right for you."
      >
        <div className="space-y-4">
          <div className="relative w-full aspect-[3/4] max-w-[280px] mx-auto rounded-xl overflow-hidden bg-muted">
            <img 
              src={photoPreview} 
              alt="Inspiration preview" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleConfirmPhoto}
              variant="cta"
              size="lg"
              className="w-full"
            >
              Confirm
            </Button>
            
            <button
              type="button"
              onClick={handleChangePhoto}
              className="w-full py-3 text-center text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Change
            </button>
          </div>
        </div>
      </FlowStep>
    );
  }

  // Visual style presets view with carousels
  if (view === 'presets') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center px-4 py-6">
        <div className="max-w-lg mx-auto w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-medium text-foreground mb-2">
              Choose a style direction
            </h1>
            <p className="text-sm text-muted-foreground mb-1">
              Pick the vibe that feels most like you.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Trust your instinct.
            </p>
            {selectedPreset && (
              <p className="text-xs text-muted-foreground mt-3 animate-fade-in">
                Direction locked: {STYLE_PRESETS.find(p => p.value === selectedPreset)?.label}
              </p>
            )}
          </div>

          {/* Visual presets grid with carousels - ensure 2-column on mobile */}
          <div className="grid grid-cols-2 gap-3">
            {STYLE_PRESETS.map((preset) => (
              <StyleCardCarousel
                key={preset.value}
                images={preset.images}
                label={preset.label}
                isSelected={selectedPreset === preset.value}
                onSelect={() => {
                  setSelectedPreset(preset.value);
                  // Auto-advance on selection
                  setTimeout(() => {
                    handleConfirmPreset();
                  }, 200);
                }}
              />
            ))}
          </div>

          <div className="space-y-3 mt-6">
            <Button
              onClick={handleConfirmPreset}
              variant="cta"
              size="lg"
              className="w-full"
              disabled={!selectedPreset}
            >
              Confirm
            </Button>
            
            <button
              type="button"
              onClick={handleClosePresets}
              className="w-full py-3 text-center text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main options view
  return (
    <FlowStep 
      title="Show us a look you like (optional)"
      subtitle="We'll match the vibe while keeping it right for you."
    >
      <div className="space-y-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload inspiration photo"
        />

        {/* Upload inspiration photo */}
        <button
          type="button"
          onClick={handleUploadClick}
          className="w-full py-4 px-6 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-muted/30 text-left transition-all duration-200 flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-lg text-foreground">Upload inspiration photo</span>
        </button>

        {/* Choose from examples - now visual with mini carousel preview */}
        <button
          type="button"
          onClick={() => setView('presets')}
          className="w-full py-4 px-6 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-muted/30 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {/* Mini preview of style options */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {thumbnailImages.map((image, idx) => (
                <div 
                  key={idx}
                  className="w-8 h-10 rounded-md overflow-hidden border-2 border-background"
                  style={{ zIndex: 4 - idx }}
                >
                  <img
                    src={image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <span className="text-lg text-foreground">Choose from examples</span>
          </div>
        </button>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Skip button - prominent enough */}
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-4 text-center text-muted-foreground hover:text-foreground transition-colors text-base font-medium"
        >
          Skip
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          Back
        </button>
      </div>
    </FlowStep>
  );
};

export default StepInspiration;
