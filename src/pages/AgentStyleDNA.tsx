import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { praxisAgentOrchestrator } from '@/lib/praxisAgentOrchestrator';
import { saveUserProfile } from '@/lib/userService';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { getRecommendedSwatches, getMetalRecommendations } from '@/lib/personalOutfitGenerator';

// Default color swatches when no photo analysis
const DEFAULT_SWATCHES = [
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Slate Grey', hex: '#6b7280' },
  { name: 'Burgundy', hex: '#722f37' },
  { name: 'Forest Green', hex: '#228b22' },
];

const DEFAULT_METALS = 'Silver, Gold, Rose Gold';

export default function AgentStyleDNA() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  useSEO();
  const hasAutoSaved = useRef(false);
  
  const context = praxisAgentOrchestrator.getContext();
  const styleDNA = praxisAgentOrchestrator.generateStyleDNA();
  
  // Get color swatches
  const skinToneBucket = context.skinTone?.bucket;
  const detectedSwatches = skinToneBucket ? getRecommendedSwatches(skinToneBucket) : null;
  const colorSwatches = detectedSwatches && detectedSwatches.length > 0 
    ? detectedSwatches.slice(0, 4).map(s => ({ name: s.name, hex: s.hex }))
    : DEFAULT_SWATCHES;
  
  const metalRecommendation = skinToneBucket 
    ? getMetalRecommendations(skinToneBucket) 
    : DEFAULT_METALS;

  const handleSaveStyle = async () => {
    if (!user) {
      return;
    }

    try {
      // Convert context to PersonalData format
      const personalData = {
        hasPhoto: context.hasPhoto || false,
        photoCropped: context.photoUrl,
        skinTone: context.skinTone,
        contrastLevel: context.contrastLevel,
        bodyProportions: context.bodyProportions,
        faceShape: context.faceShape,
        fitCalibration: context.fitInfo ? {
          height: context.fitInfo.height,
          heightUnit: context.fitInfo.heightUnit || 'cm',
          fitPreference: context.fitInfo.fitPreference,
        } : undefined,
        lifestyle: (context.lifestyle as any) || '',
        hasInspiration: !!context.inspirationStyle,
        inspirationPreset: context.inspirationStyle as any,
        hasWardrobe: !!context.wardrobeItems,
        wardrobeItems: context.wardrobeItems,
        styleDNA: styleDNA || undefined,
        styleColorProfile: context.styleColorProfile,
      };

      const userEmail = user.primaryEmailAddress?.emailAddress;
      await saveUserProfile(user.id, personalData as any, userEmail);
      
      // Save to localStorage
      localStorage.setItem('praxis_style_dna', JSON.stringify({
        colorSwatches,
        metalRecommendation,
        skinTone: context.skinTone,
        contrastLevel: context.contrastLevel,
        lifestyle: context.lifestyle,
        inspirationPreset: context.inspirationStyle,
        savedAt: new Date().toISOString(),
      }));
      
      toast.success('Style DNA saved');
      hasAutoSaved.current = true;
    } catch (error) {
      console.error('Error saving style DNA:', error);
      toast.error('Failed to save style DNA');
    }
  };

  // Auto-save if user is authenticated
  useEffect(() => {
    if (isLoaded && user && !hasAutoSaved.current) {
      handleSaveStyle();
    }
  }, [isLoaded, user]);

  const handleStyleAgain = () => {
    praxisAgentOrchestrator.reset();
    localStorage.removeItem('praxis_agent_photo');
    localStorage.removeItem('praxis_agent_show_style_dna');
    navigate('/agent');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="px-4 md:px-6 h-14 flex items-center w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/agent/purchase')}
                className="shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-serif text-xl font-medium text-foreground tracking-wide">
                Your Style DNA
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-16 pb-24 px-4 max-w-2xl mx-auto">
        <div className="space-y-8 py-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <Sparkles className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-2xl font-medium">Your Style Profile</h2>
            <p className="text-sm text-muted-foreground">
              Personalized recommendations based on your preferences
            </p>
          </div>

          {/* Style DNA */}
          {styleDNA && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
              <h3 className="text-lg font-medium">Primary Style</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {styleDNA.primaryStyle.replace(/_/g, ' ').toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                Confidence: {styleDNA.confidence}
              </p>
            </div>
          )}

          {/* Color Recommendations */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h3 className="text-lg font-medium">Recommended Colors</h3>
            <div className="grid grid-cols-4 gap-3">
              {colorSwatches.map((swatch, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className="w-full aspect-square rounded-lg border border-border"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <p className="text-xs text-center text-muted-foreground">{swatch.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Metal Recommendations */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-2">
            <h3 className="text-lg font-medium">Metal Recommendations</h3>
            <p className="text-sm text-muted-foreground">{metalRecommendation}</p>
          </div>

          {/* Lifestyle */}
          {context.lifestyle && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-2">
              <h3 className="text-lg font-medium">Lifestyle</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {String(context.lifestyle).toLowerCase()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4">
            {!isLoaded || !user ? (
              <SignInButton mode="modal">
                <Button variant="default" size="lg" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Sign in to Save Style DNA
                </Button>
              </SignInButton>
            ) : (
              <Button onClick={handleSaveStyle} variant="default" size="lg" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Style DNA
              </Button>
            )}
            <Button onClick={handleStyleAgain} variant="outline" size="lg" className="w-full">
              Style Another Look
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
