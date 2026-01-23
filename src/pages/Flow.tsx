import { useState, useMemo, useCallback, useEffect } from 'react';
import ProgressIndicator from '@/components/app/ProgressIndicator';
import StepModeSelect from '@/components/app/StepModeSelect';
import StepOccasion from '@/components/app/StepOccasion';
import StepContext from '@/components/app/StepContext';
import StepPreferences from '@/components/app/StepPreferences';
import StepResults from '@/components/app/StepResults';
import StepComplete from '@/components/app/StepComplete';
import StepPurchase from '@/components/app/StepPurchase';
import StepPhoto from '@/components/app/StepPhoto';
import StepFitCalibration from '@/components/app/StepFitCalibration';
import StepLifestyle from '@/components/app/StepLifestyle';
import StepWardrobe from '@/components/app/StepWardrobe';
import StepInspiration from '@/components/app/StepInspiration';
import StepPersonalResults from '@/components/app/StepPersonalResults';
import StepStyleDNA from '@/components/app/StepStyleDNA';
import StepPersonalLoading from '@/components/app/StepPersonalLoading';
import StepVirtualTryOn from '@/components/app/StepVirtualTryOn';
import { generateOutfits, generateAlternativeOutfits, hasAlternativeOutfits } from '@/lib/outfitGenerator';
import { generatePersonalOutfits, deriveStyleColorProfile, getRecommendedSwatches } from '@/lib/personalOutfitGenerator';
import { saveOutfitToHistory, updateOutfitHistoryTryOn } from '@/lib/userService';
import { useUser, UserButton, SignInButton } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import type { 
  OccasionData, 
  ContextData, 
  PreferencesData, 
  FlowData, 
  Outfit, 
  OccasionType,
  FlowMode,
  PersonalData,
  LifestyleType,
  InspirationPresetType,
  StyleDNA,
  SkinToneData,
  ContrastLevel,
  WardrobeItems,
  BodyProportions,
  FaceShapeData,
  HeightUnit,
  FitPreference,
} from '@/types/praxis';

const initialOccasion: OccasionData = {
  event: '',
};

const initialContext: ContextData = {
  location: '',
  when: '',
  setting: '',
};

const initialPreferences: PreferencesData = {
  priority: '',
  budget: '',
};

const initialPersonal: PersonalData = {
  hasPhoto: false,
  lifestyle: '',
  hasWardrobe: false,
  hasInspiration: false,
};

// Flow steps:
// 0: Mode Select
// Quick flow (mode = 'quick'):
//   1: Occasion, 2: Context, 3: Preferences, 4: Results, 5: Virtual Try-On, 6: Complete (with upsell)
// Personal flow (mode = 'personal'):
//   10: Photo, 11: Fit Calibration, 12: Lifestyle, 13: Inspiration, 14: Wardrobe, 15: Loading, 16: Personal Results, 17: Virtual Try-On, 18: Style DNA (final)

const Flow = () => {
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<FlowMode | null>(null);
  
  // Quick flow state
  const [occasion, setOccasion] = useState<OccasionData>(initialOccasion);
  const [context, setContext] = useState<ContextData>(initialContext);
  const [preferences, setPreferences] = useState<PreferencesData>(initialPreferences);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [usedOutfitIds, setUsedOutfitIds] = useState<string[]>([]);
  
  // Personal flow state
  const [personal, setPersonal] = useState<PersonalData>(initialPersonal);
  const [personalOutfits, setPersonalOutfits] = useState<Outfit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Track selected outfit for analytics
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [tryOnImageUrl, setTryOnImageUrl] = useState<string | null>(null);
  const [historyEntryId, setHistoryEntryId] = useState<string | null>(null);
  
  const { user, isLoaded } = useUser();

  // Check if we're editing profile or using outfit again or coming from dashboard
  useEffect(() => {
    const state = location.state as { editProfile?: boolean; occasion?: string } | null;
    if (state?.editProfile && isLoaded && user) {
      setMode('personal');
      setStep(10);
    } else if (state?.occasion) {
      // Pre-select occasion (from dashboard or "Use this outfit again")
      setMode('quick');
      setOccasion({ event: state.occasion.toUpperCase() as OccasionType });
      setStep(1);
    }
  }, [location.state, isLoaded, user]);

  // Guard: Show sign-in prompt at step 10 (Photo) if not authenticated
  // Allow users to start personal flow but require auth at photo step

  // Quick flow handlers
  const handleGetOutfits = () => {
    const flowData: FlowData = { occasion, context, preferences };
    const { outfits: generatedOutfits, usedIds } = generateOutfits(flowData, []);
    setOutfits(generatedOutfits);
    setUsedOutfitIds(usedIds);
    setStep(4);
  };

  const handleShowAlternatives = useCallback(() => {
    const flowData: FlowData = { occasion, context, preferences };
    const { outfits: alternativeOutfits, usedIds } = generateAlternativeOutfits(flowData, usedOutfitIds);
    if (alternativeOutfits.length > 0) {
      setOutfits(alternativeOutfits);
      setUsedOutfitIds(prev => [...prev, ...usedIds]);
    }
  }, [occasion, context, preferences, usedOutfitIds]);

  const hasAlternatives = useMemo(() => {
    const flowData: FlowData = { occasion, context, preferences };
    return hasAlternativeOutfits(flowData, usedOutfitIds);
  }, [occasion, context, preferences, usedOutfitIds]);

  // Personal flow handlers - trigger generation and go to loading step
  const handleStartPersonalGeneration = useCallback(() => {
    setIsGenerating(true);
    setGenerationError(null);
    setStep(15); // Go to loading step
  }, []);

  // Effect to handle outfit generation when on loading step
  useEffect(() => {
    if (step === 15 && isGenerating) {
      const generateWithRetry = async () => {
        try {
          // Small delay to ensure smooth transition
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const generated = generatePersonalOutfits(personal);
          
          if (generated.length >= 3) {
            setPersonalOutfits(generated);
            setIsGenerating(false);
            setRetryCount(0);
            setStep(16); // Go to results
          } else if (retryCount < 1) {
            // Retry once if we don't have 3 outfits
            setRetryCount(prev => prev + 1);
            // Trigger re-run
            setTimeout(() => {
              const retryGenerated = generatePersonalOutfits(personal);
              if (retryGenerated.length > 0) {
                setPersonalOutfits(retryGenerated);
                setIsGenerating(false);
                setStep(16);
              } else {
                setGenerationError("We're refining your style. Please try again.");
                setIsGenerating(false);
              }
            }, 1000);
          } else {
            setGenerationError("We're refining your style. Please try again.");
            setIsGenerating(false);
          }
        } catch {
          if (retryCount < 1) {
            setRetryCount(prev => prev + 1);
          } else {
            setGenerationError("We're refining your style. Please try again.");
            setIsGenerating(false);
          }
        }
      };
      
      generateWithRetry();
    }
  }, [step, isGenerating, personal, retryCount]);

  // Retry generation
  const handleRetryGeneration = useCallback(() => {
    setRetryCount(0);
    setGenerationError(null);
    setIsGenerating(true);
  }, []);

  // Reset all state
  const handleRestart = () => {
    setMode(null);
    setOccasion(initialOccasion);
    setContext(initialContext);
    setPreferences(initialPreferences);
    setOutfits([]);
    setUsedOutfitIds([]);
    setPersonal(initialPersonal);
    setPersonalOutfits([]);
    setIsGenerating(false);
    setGenerationError(null);
    setRetryCount(0);
    setSelectedOutfitId(null);
    setSelectedOutfit(null);
    setTryOnImageUrl(null);
    setHistoryEntryId(null);
    setStep(0);
  };

  // Progress indicator logic
  const getProgressInfo = () => {
    if (mode === 'quick') {
      // Quick flow: 1=Occasion, 2=Context, 3=Preferences, 4=Results, 5=Purchase
      if (step >= 1 && step <= 5) {
        return { current: step, total: 5, show: true };
      }
    }
    if (mode === 'personal') {
      // Personal flow: 10=Photo, 11=Fit, 12=Lifestyle, 13=Inspiration, 14=Wardrobe, 15=Loading, 16=Results, 17=TryOn, 18=StyleDNA
      if (step >= 10 && step <= 18) {
        return { current: step - 9, total: 9, show: true };
      }
    }
    return { current: 0, total: 0, show: false };
  };

  // Show "Start over" in header for intermediate steps
  const showStartOver = (mode === 'quick' && step >= 1 && step <= 5) || 
                        (mode === 'personal' && step >= 10 && step <= 17);

  const progress = getProgressInfo();

  const renderStep = () => {
    switch (step) {
      // Mode selection
      case 0:
        return (
          <StepModeSelect
            onSelectQuick={() => {
              setMode('quick');
              setStep(1);
            }}
            onSelectPersonal={() => {
              // Allow starting personal flow without auth - sign-in prompt will appear at photo step
              setMode('personal');
              setStep(10);
            }}
          />
        );
      
      // Quick flow
      case 1:
        return (
          <StepOccasion
            value={occasion.event}
            onNext={(event: OccasionType) => {
              setOccasion({ event });
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        );
      case 2:
        return (
          <StepContext
            data={context}
            occasion={occasion.event as OccasionType}
            onUpdate={setContext}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        );
      case 3:
        return (
          <StepPreferences
            data={preferences}
            onUpdate={setPreferences}
            onSubmit={handleGetOutfits}
            onBack={() => setStep(2)}
          />
        );
      case 4:
        return (
          <StepResults
            outfits={outfits}
            occasion={occasion.event as OccasionType}
            onRestart={handleRestart}
            onShowAlternatives={handleShowAlternatives}
            hasAlternatives={hasAlternatives}
            onComplete={async (outfitId: number) => {
              setSelectedOutfitId(outfitId);
              const outfit = outfits.find(o => o.id === outfitId);
              if (outfit) {
                setSelectedOutfit(outfit);
                // Store selection for analytics
                localStorage.setItem('praxis_selected_outfit', JSON.stringify({
                  outfitId,
                  mode: 'quick',
                  timestamp: new Date().toISOString(),
                }));
                // Save to history if user is authenticated
                if (user) {
                  try {
                    await saveOutfitToHistory(
                      user.id,
                      outfit,
                      occasion.event as OccasionType,
                      undefined, // No try-on for Quick Flow
                      undefined
                    );
                  } catch (err) {
                    console.error('Error saving Quick Flow outfit to history:', err);
                  }
                }
                // Check if user has photo for try-on (only in personal flow, so skip to complete)
                setStep(5); // Go to virtual try-on if photo available, otherwise complete
              }
            }}
            onBack={() => setStep(3)}
          />
        );
      case 5:
        // Purchase page for Quick Flow - show purchase links for selected outfit
        if (selectedOutfit) {
          return (
            <StepPurchase
              outfit={selectedOutfit}
              onBack={() => setStep(4)}
              onRestart={handleRestart}
            />
          );
        }
        // Fallback to complete if no outfit selected
        return (
          <StepComplete 
            onRestart={handleRestart}
            showUpsell={true}
            onStartPersonal={() => {
              // Require authentication
              if (isLoaded && user) {
                setMode('personal');
                setStep(10);
              }
              // If not authenticated, StepComplete will show sign-in button
            }}
          />
        );
      case 6:
        // Complete with upsell to personal flow
        return (
          <StepComplete 
            onRestart={handleRestart}
            showUpsell={true}
            onStartPersonal={() => {
              // Require authentication
              if (isLoaded && user) {
                setMode('personal');
                setStep(10);
              }
              // If not authenticated, StepComplete will show sign-in button
            }}
          />
        );
      
      // Personal flow - show sign-in prompt at photo step if not authenticated
      case 10:
        return (
          <StepPhoto
            onPhotoConfirmed={(result: { 
              originalPhoto: string; 
              croppedPhoto: string; 
              skinTone?: SkinToneData; 
              contrastLevel?: ContrastLevel;
              bodyProportions?: BodyProportions;
              faceShape?: FaceShapeData;
            }) => {
              // Derive style color profile from photo analysis
              const styleColorProfile = result.skinTone ? deriveStyleColorProfile({
                ...personal,
                skinTone: result.skinTone,
                contrastLevel: result.contrastLevel,
              }) : undefined;
              
              setPersonal(p => ({ 
                ...p, 
                hasPhoto: true, 
                photoOriginal: result.originalPhoto,
                photoData: result.croppedPhoto,
                photoCropped: result.croppedPhoto,
                skinTone: result.skinTone,
                contrastLevel: result.contrastLevel,
                styleColorProfile,
                bodyProportions: result.bodyProportions,
                faceShape: result.faceShape,
              }));
              setStep(11);
            }}
            onSkip={() => setStep(11)}
            onBack={() => setStep(0)}
          />
        );
      case 11:
        // Guard: Require authentication
        if (isLoaded && !user) {
          setMode(null);
          setStep(0);
          return null;
        }
        return (
          <StepFitCalibration
            onComplete={(data: { height?: number; heightUnit: HeightUnit; fitPreference?: FitPreference }) => {
              setPersonal(p => ({ 
                ...p, 
                fitCalibration: {
                  height: data.height,
                  heightUnit: data.heightUnit,
                  fitPreference: data.fitPreference,
                }
              }));
              setStep(12);
            }}
            onSkip={() => setStep(12)}
            onBack={() => setStep(10)}
          />
        );
      case 12:
        // Guard: Require authentication
        if (isLoaded && !user) {
          setMode(null);
          setStep(0);
          return null;
        }
        return (
          <StepLifestyle
            value={personal.lifestyle}
            onSelect={(lifestyle: LifestyleType) => {
              setPersonal(p => ({ ...p, lifestyle }));
              setStep(13);
            }}
            onBack={() => setStep(11)}
          />
        );
      case 13:
        // Guard: Require authentication
        if (isLoaded && !user) {
          setMode(null);
          setStep(0);
          return null;
        }
        return (
          <StepInspiration
            onInspirationPhoto={(photoData: string) => {
              setPersonal(p => ({ ...p, hasInspiration: true, inspirationData: photoData }));
              setStep(14);
            }}
            onInspirationPreset={(preset: InspirationPresetType, images: string[], styleDNA: StyleDNA) => {
              setPersonal(p => ({ 
                ...p, 
                hasInspiration: true, 
                inspirationPreset: preset,
                styleDirectionImages: images,
                styleDNA 
              }));
              setStep(14);
            }}
            onSkip={() => setStep(14)}
            onBack={() => setStep(12)}
          />
        );
      case 14:
        // Guard: Require authentication
        if (isLoaded && !user) {
          setMode(null);
          setStep(0);
          return null;
        }
        return (
          <StepWardrobe
            onWardrobeUpdate={(items: WardrobeItems) => {
              const hasItems = Object.values(items).some(item => item !== null);
              setPersonal(p => ({ ...p, hasWardrobe: hasItems, wardrobeItems: items }));
            }}
            onSkip={handleStartPersonalGeneration}
            onBack={() => setStep(13)}
            onContinue={(items: WardrobeItems) => {
              const hasItems = Object.values(items).some(item => item !== null);
              setPersonal(p => ({ ...p, hasWardrobe: hasItems, wardrobeItems: items }));
              handleStartPersonalGeneration();
            }}
          />
        );
      case 15:
        // Guard: Require authentication
        if (isLoaded && !user) {
          setMode(null);
          setStep(0);
          return null;
        }
        // Loading/generating step
        return (
          <StepPersonalLoading
            isGenerating={isGenerating}
            error={generationError}
            onRetry={handleRetryGeneration}
            onBack={() => setStep(14)}
          />
        );
      case 16:
        // Guard: Require authentication
        if (isLoaded && !user) {
          setMode(null);
          setStep(0);
          return null;
        }
        // Personal results - only show if we have outfits
        return (
          <StepPersonalResults
            outfits={personalOutfits}
            personalData={personal}
            onRestart={handleRestart}
            onComplete={async (outfitId: number) => {
              setSelectedOutfitId(outfitId);
              const outfit = personalOutfits.find(o => o.id === outfitId);
              if (outfit) {
                setSelectedOutfit(outfit);
                // Store selection for analytics
                localStorage.setItem('praxis_selected_outfit', JSON.stringify({
                  outfitId,
                  mode: 'personal',
                  timestamp: new Date().toISOString(),
                }));
                // Save to history immediately if user is authenticated
                if (user) {
                  try {
                    const colorPalette = personal.skinTone?.bucket
                      ? getRecommendedSwatches(personal.skinTone.bucket).slice(0, 4).map(s => ({ name: s.name, hex: s.hex }))
                      : null;
                    
                    const entryId = await saveOutfitToHistory(
                      user.id,
                      outfit,
                      personal.lifestyle as OccasionType || 'WORK',
                      undefined, // Try-on URL will be added later if available
                      undefined,
                      undefined, // styleName - will be set when try-on completes
                      personal.styleDNA || undefined,
                      colorPalette || undefined
                    );
                    setHistoryEntryId(entryId);
                  } catch (err) {
                    console.error('Error saving outfit to history:', err);
                  }
                }
                // Go to virtual try-on if photo available
                setStep(17);
              }
            }}
            onBack={() => setStep(14)}
          />
        );
      case 17:
        // Guard: Require authentication
        if (isLoaded && !user) {
          setMode(null);
          setStep(0);
          return null;
        }
        // Virtual Try-On for personal flow
        if (selectedOutfit && personal.hasPhoto && personal.photoCropped) {
          return (
            <StepVirtualTryOn
              outfit={selectedOutfit}
              userPhoto={personal.photoCropped}
              personalData={personal}
              onBack={() => setStep(16)}
              onComplete={async (tryOnUrl: string, styleName?: string) => {
                setTryOnImageUrl(tryOnUrl);
                
                // Update history entry with try-on URL, style name, DNA, and colors
                if (user && historyEntryId && selectedOutfit) {
                  try {
                    const colorPalette = personal.skinTone?.bucket
                      ? getRecommendedSwatches(personal.skinTone.bucket).slice(0, 4).map(s => ({ name: s.name, hex: s.hex }))
                      : null;
                    
                    await updateOutfitHistoryTryOn(
                      user.id,
                      historyEntryId,
                      tryOnUrl,
                      styleName,
                      personal.styleDNA || undefined,
                      colorPalette || undefined
                    );
                  } catch (err) {
                    console.error('Error updating history with try-on URL:', err);
                  }
                }
                
                setStep(18);
              }}
              onSkip={() => setStep(18)}
            />
          );
        }
        // No photo, go directly to Style DNA
        return (
          <StepStyleDNA
            personalData={personal}
            onStyleAgain={handleRestart}
            onBack={() => setStep(16)}
          />
        );
      case 18:
        // Guard: Require authentication
        if (isLoaded && !user) {
          setMode(null);
          setStep(0);
          return null;
        }
        return (
          <StepStyleDNA
            personalData={personal}
            onStyleAgain={handleRestart}
            onBack={() => setStep(17)}
          />
        );
      
      default:
        return null;
    }
  };

  // Show tagline only on mode select screen
  const showTagline = step === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex flex-col items-start py-2">
            <button 
              onClick={handleRestart}
              className="text-2xl md:text-3xl font-medium text-foreground tracking-wide"
            >
              <span className="font-serif">Praxis</span>
            </button>
            {showTagline && (
              <p className="text-sm text-muted-foreground mt-1.5">
                Get dressed right, in under a minute.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {showStartOver && (
              <button
                onClick={handleRestart}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Start over
              </button>
            )}
            
            {/* User actions */}
            {isLoaded && user && (
              <>
                <button
                  onClick={() => window.location.href = '/history'}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History
                </button>
                <button
                  onClick={() => window.location.href = '/favorites'}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Favorites
                </button>
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Style
                </button>
                <UserButton afterSignOutUrl="/" />
              </>
            )}
            
            {isLoaded && !user && (
              <SignInButton mode="modal">
                <button className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-12">
        {progress.show && (
          <div className="pt-4">
            <ProgressIndicator currentStep={progress.current} totalSteps={progress.total} />
          </div>
        )}
        {renderStep()}
      </main>
    </div>
  );
};

export default Flow;
