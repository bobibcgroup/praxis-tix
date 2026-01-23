import { Button } from '@/components/ui/button';
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
  
  // Get color swatches - use detected or defaults
  const skinToneBucket = personalData.skinTone?.bucket;
  const detectedSwatches = skinToneBucket ? getRecommendedSwatches(skinToneBucket) : null;
  const colorSwatches = detectedSwatches && detectedSwatches.length > 0 
    ? detectedSwatches.slice(0, 4).map(s => ({ name: s.name, hex: s.hex }))
    : DEFAULT_SWATCHES;
  
  const metalRecommendation = skinToneBucket 
    ? getMetalRecommendations(skinToneBucket) 
    : DEFAULT_METALS;

  const handleSaveStyle = async () => {
    // If not authenticated, show sign-in modal
    if (!user) {
      // The button will trigger SignInButton modal
      return;
    }

    // Save style DNA to localStorage
    const styleDNA = {
      colorSwatches,
      metalRecommendation,
      skinTone: personalData.skinTone,
      contrastLevel: personalData.contrastLevel,
      lifestyle: personalData.lifestyle,
      inspirationPreset: personalData.inspirationPreset,
      savedAt: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem('praxis_style_dna', JSON.stringify(styleDNA));
      
      // Save to database
      try {
        await saveUserProfile(user.id, personalData);
      } catch (err) {
        console.error('Error saving to database:', err);
        // Don't show error, localStorage save succeeded
      }
      
      toast.success('Style DNA saved');
    } catch {
      toast.error('Could not save your style');
    }
  };

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
