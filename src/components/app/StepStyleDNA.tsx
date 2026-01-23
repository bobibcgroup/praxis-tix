import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import type { PersonalData } from '@/types/praxis';
import { 
  getRecommendedSwatches,
  getMetalRecommendations,
} from '@/lib/personalOutfitGenerator';
import { saveUserProfile } from '@/lib/userService';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { User, Save } from 'lucide-react';

interface StepStyleDNAProps {
  personalData: PersonalData;
  onStyleAgain: () => void;
  onBack?: () => void;
}

// Default color swatches when no photo analysis
const DEFAULT_SWATCHES = [
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Slate Grey', hex: '#6b7280' },
  { name: 'Burgundy', hex: '#722f37' },
  { name: 'Forest Green', hex: '#228b22' },
];

// Default metal recommendation
const DEFAULT_METALS = 'Silver, Gold, Rose Gold';

const StepStyleDNA = ({ personalData, onStyleAgain, onBack }: StepStyleDNAProps) => {
  const { user, isLoaded } = useUser();
  const hasAutoSaved = useRef(false);
  
  // Get color swatches - use detected or defaults
  const skinToneBucket = personalData.skinTone?.bucket;
  const detectedSwatches = skinToneBucket ? getRecommendedSwatches(skinToneBucket) : null;
  const colorSwatches = detectedSwatches && detectedSwatches.length > 0 
    ? detectedSwatches.slice(0, 4).map(s => ({ name: s.name, hex: s.hex }))
    : DEFAULT_SWATCHES;
  
  const metalRecommendation = skinToneBucket 
    ? getMetalRecommendations(skinToneBucket) 
    : DEFAULT_METALS;

  const handleSaveStyle = async (isAutoSave = false) => {
    // If not authenticated, show sign-in modal
    if (!user) {
      // The button will trigger SignInButton modal
      return;
    }

    // Validate that we have at least lifestyle or styleDNA to save
    if (!personalData.lifestyle && !personalData.styleDNA) {
      console.warn('⚠️ Cannot save profile: missing lifestyle and styleDNA');
      if (!isAutoSave) {
        toast.error('Please complete the style flow first');
      }
      return;
    }

    // Create styleDNA object for localStorage (even if personalData.styleDNA is missing)
    // This ensures we save the color recommendations and other data
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
      console.log('✅ Style DNA saved to localStorage');
      
      // Prepare profile data for database save
      // Ensure we have at least lifestyle, even if styleDNA is missing
      const profileDataToSave: typeof personalData = {
        ...personalData,
        lifestyle: personalData.lifestyle || '',
        // If styleDNA is missing but we have lifestyle, create a minimal styleDNA
        styleDNA: personalData.styleDNA || (personalData.lifestyle ? {
          primaryStyle: 'CLASSIC_TAILORED' as any, // Default style
          confidence: 'medium' as any
        } : undefined),
      };
      
      // Save to database
      try {
        console.log('💾 Saving profile to database:', {
          hasStyleDNA: !!profileDataToSave.styleDNA,
          lifestyle: profileDataToSave.lifestyle,
          hasFitCalibration: !!profileDataToSave.fitCalibration
        });
        const userEmail = user.primaryEmailAddress?.emailAddress;
        await saveUserProfile(user.id, profileDataToSave, userEmail);
        console.log('✅ Profile saved successfully to database');
        if (!isAutoSave) {
          toast.success('Style DNA saved');
        }
      } catch (err) {
        console.error('❌ Error saving to database:', err);
        console.error('   Error details:', err);
        if (!isAutoSave) {
          toast.error(`Could not save your style: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        // Don't throw - localStorage save succeeded
      }
    } catch (err) {
      console.error('❌ Error saving style DNA to localStorage:', err);
      if (!isAutoSave) {
        toast.error('Could not save your style');
      }
    }
  };

  // Auto-save profile when component mounts and user is authenticated
  // Save if we have styleDNA OR lifestyle (for cases where photo was skipped)
  useEffect(() => {
    if (isLoaded && user && (personalData.styleDNA || personalData.lifestyle) && !hasAutoSaved.current) {
      hasAutoSaved.current = true;
      console.log('💾 Auto-saving profile after Style DNA completion', {
        hasStyleDNA: !!personalData.styleDNA,
        hasLifestyle: !!personalData.lifestyle
      });
      handleSaveStyle(true); // Pass true to indicate auto-save (no toast)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, personalData.styleDNA, personalData.lifestyle]);

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      {/* Back navigation */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:underline transition-colors duration-200 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          Back to my outfits
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl md:text-3xl font-medium text-foreground">
          Your Style DNA
        </h1>
      </div>

      {/* Subtext */}
      <p className="text-sm text-muted-foreground text-center mb-10">
        This is the framework that consistently works for you.
      </p>

      {/* Style Name - Hero */}
      <div className="mb-12">
        <p className="text-3xl md:text-4xl text-foreground font-serif italic text-center font-medium">
          "Understated. Refined. Effortless."
        </p>
      </div>

      {/* Your optimal palette */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Your optimal palette
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Balanced tones that enhance your natural contrast and complexion.
        </p>
        <div className="flex justify-start gap-4">
          {colorSwatches.map((swatch, index) => (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <div 
                className="w-10 h-10 rounded-full border border-border shadow-sm"
                style={{ backgroundColor: swatch.hex }}
                title={swatch.name}
              />
              <span className="text-xs text-muted-foreground">{swatch.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best metals */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          Best metals: <span className="text-foreground">{metalRecommendation}</span>
        </p>
      </div>

      {/* Lean into - max 3 bullets */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Lean into
        </h2>
        <ul className="space-y-2">
          <li className="flex items-start gap-3 text-foreground">
            <span className="text-primary mt-0.5">•</span>
            <span>Balanced warm and cool tones</span>
          </li>
          <li className="flex items-start gap-3 text-foreground">
            <span className="text-primary mt-0.5">•</span>
            <span>Medium-contrast outfits that feel grounded</span>
          </li>
          <li className="flex items-start gap-3 text-foreground">
            <span className="text-primary mt-0.5">•</span>
            <span>Jewel tones for structure and emphasis</span>
          </li>
        </ul>
      </div>

      {/* Avoid - max 3 bullets */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Avoid
        </h2>
        <ul className="space-y-2">
          <li className="flex items-start gap-3 text-foreground">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>Overly bright neons that overpower</span>
          </li>
          <li className="flex items-start gap-3 text-foreground">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>Very pale shades that flatten contrast</span>
          </li>
        </ul>
      </div>

      {/* Closing line */}
      <div className="mb-10 text-center">
        <p className="text-sm text-muted-foreground">
          Style is clarity. You now have yours.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {isLoaded && user ? (
          <Button 
            onClick={handleSaveStyle}
            variant="cta"
            size="lg"
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Save my style
          </Button>
        ) : isLoaded ? (
          <SignInButton mode="modal">
            <Button 
              onClick={handleSaveStyle}
              variant="cta"
              size="lg"
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save my style
            </Button>
          </SignInButton>
        ) : (
          <Button 
            variant="cta"
            size="lg"
            className="w-full"
            disabled
          >
            Loading...
          </Button>
        )}
        
        <Button 
          onClick={onStyleAgain}
          variant="outline"
          size="lg"
          className="w-full text-muted-foreground"
        >
          Style me again
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        {isLoaded && user 
          ? "This profile will guide every future recommendation."
          : isLoaded
          ? "Sign in when you save to access your style profile across all devices."
          : ""
        }
      </p>
    </div>
  );
};

export default StepStyleDNA;
