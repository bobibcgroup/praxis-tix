import { useState, useMemo, useCallback, useEffect } from 'react';
import { SEO } from '@/components/SEO';
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
import StyleNameModal from '@/components/app/StyleNameModal';
import { generateOutfits, generateAlternativeOutfits, hasAlternativeOutfits } from '@/lib/outfitGenerator';
import { generatePersonalOutfits, deriveStyleColorProfile, getRecommendedSwatches } from '@/lib/personalOutfitGenerator';
import { saveOutfitToHistory, updateOutfitHistoryTryOn, updateOutfitHistoryStyleName } from '@/lib/userService';
import { useUser, UserButton, SignInButton } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNavMenu } from '@/components/app/MobileNavMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
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
  const navigate = useNavigate();
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
  const [quickFlowStyleName, setQuickFlowStyleName] = useState<string | null>(null);
  const [showQuickFlowNameModal, setShowQuickFlowNameModal] = useState(false);
  
  const { user, isLoaded } = useUser();
  
  // Debug: Log user state changes
  useEffect(() => {
    if (isLoaded) {
      console.log('User state loaded:', { userId: user?.id, isAuthenticated: !!user });
    }
  }, [user, isLoaded]);
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setQuickFlowStyleName(null);
    setShowQuickFlowNameModal(false);
    // Clear generation tracking state
    localStorage.removeItem('praxis_active_generation');
    localStorage.removeItem('praxis_current_history_entry_id');
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
        // Map steps to progress: 10->1, 11->2, 12->3, 13->4, 14->5, 15->6, 16->7, 17->8, 18->9
        const adjustedStep = step - 9;
        return { current: adjustedStep, total: 9, show: true };
      }
    }
    return { current: 0, total: 0, show: false };
  };

  // Show "Start over" in header for intermediate steps
  const showStartOver = (mode === 'quick' && step >= 1 && step <= 5) || 
                        (mode === 'personal' && step >= 10 && step <= 17);

  const progress = getProgressInfo();

  // Update SEO metadata based on flow step
  useEffect(() => {
    if (step === 0) {
      document.title = 'Praxis — Smart Styling, Instantly';
    } else if (mode === 'quick' && step === 4) {
      document.title = 'Your Looks — Praxis';
    } else if (mode === 'personal' && step === 16) {
      document.title = 'Your Looks — Praxis Agent';
    }
  }, [step, mode]);

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
                if (isLoaded && user) {
                  try {
                    // Validate occasion before saving
                    const occasionValue = occasion.event as OccasionType;
                    if (!occasionValue || occasionValue === '') {
                      console.error('Invalid occasion value:', occasionValue);
                      toast.error('Cannot save: Invalid occasion');
                      return;
                    }
                    
                    console.log('Saving Quick Flow outfit to history:', {
                      userId: user.id,
                      outfitId: outfit.id,
                      outfitTitle: outfit.title,
                      occasion: occasionValue
                    });
                    
                    const entryId = await saveOutfitToHistory(
                      user.id,
                      outfit,
                      occasionValue,
                      undefined, // No try-on for Quick Flow
                      undefined,
                      undefined, // styleName - will be set when user names it
                      undefined,
                      undefined
                    );
                    
                    setHistoryEntryId(entryId);
                    
                    if (entryId) {
                      console.log('✅ Quick Flow outfit saved to history successfully:', entryId);
                      toast.success('Outfit saved to history');
                    } else {
                      console.warn('⚠️ saveOutfitToHistory returned null');
                      toast.error('Failed to save outfit to history');
                    }
                  } catch (err) {
                    console.error('❌ Error saving Quick Flow outfit to history:', err);
                    // Show user-friendly error
                    toast.error('Failed to save outfit to history');
                  }
                } else if (!isLoaded) {
                  console.warn('User state not loaded yet, skipping history save');
                } else {
                  console.warn('User not authenticated, skipping history save');
                }
                // If user is signed in, show name modal, otherwise go to purchase
                if (isLoaded && user) {
                  setShowQuickFlowNameModal(true);
                } else {
                  setStep(5); // Go to purchase page
                }
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
            onSkip={() => {
              setStep(14);
            }}
            onBack={() => setStep(12)}
          />
        );
      case 14:
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
                if (isLoaded && user) {
                  try {
                    // Validate lifestyle/occasion before saving
                    const occasionValue = (personal.lifestyle as OccasionType) || 'WORK';
                    
                    console.log('Saving Personal Flow outfit to history:', {
                      userId: user.id,
                      outfitId: outfit.id,
                      outfitTitle: outfit.title,
                      occasion: occasionValue,
                      hasStyleDNA: !!personal.styleDNA,
                      hasSkinTone: !!personal.skinTone
                    });
                    
                    const colorPalette = personal.skinTone?.bucket
                      ? getRecommendedSwatches(personal.skinTone.bucket).slice(0, 4).map(s => ({ name: s.name, hex: s.hex }))
                      : null;
                    
                    const entryId = await saveOutfitToHistory(
                      user.id,
                      outfit,
                      occasionValue,
                      undefined, // Try-on URL will be added later if available
                      undefined,
                      undefined, // styleName - will be set when try-on completes
                      personal.styleDNA || undefined,
                      colorPalette || undefined
                    );
                    
                    setHistoryEntryId(entryId);
                    
                    // Store historyEntryId in localStorage for background generation tracking
                    if (entryId) {
                      localStorage.setItem('praxis_current_history_entry_id', entryId);
                      console.log('✅ Personal flow outfit saved to history successfully:', entryId);
                      toast.success('Outfit saved to history');
                    } else {
                      console.warn('⚠️ saveOutfitToHistory returned null');
                      toast.error('Failed to save outfit to history');
                    }
                  } catch (err) {
                    console.error('❌ Error saving outfit to history:', err);
                    toast.error('Failed to save outfit to history');
                  }
                } else if (!isLoaded) {
                  console.warn('User state not loaded yet, skipping history save');
                } else {
                  console.warn('User not authenticated, skipping history save');
                }
                // Go to virtual try-on if photo available
                setStep(17);
              }
            }}
            onBack={() => setStep(14)}
          />
        );
      case 17:
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
                
                console.log('📝 onComplete called with style name:', styleName);
                
                // Update history entry with try-on URL, style name, DNA, and colors
                if (user && historyEntryId && selectedOutfit) {
                  try {
                    const colorPalette = personal.skinTone?.bucket
                      ? getRecommendedSwatches(personal.skinTone.bucket).slice(0, 4).map(s => ({ name: s.name, hex: s.hex }))
                      : null;
                    
                    console.log('🔄 Updating history entry from onComplete:', {
                      historyEntryId,
                      userId: user.id,
                      styleName,
                      hasTryOnUrl: !!tryOnUrl
                    });
                    
                    await updateOutfitHistoryTryOn(
                      user.id,
                      historyEntryId,
                      tryOnUrl,
                      styleName,
                      personal.styleDNA || undefined,
                      colorPalette || undefined,
                      selectedOutfit.id // Pass outfitId as fallback
                    );
                    
                    console.log('✅ History updated successfully from onComplete');
                  } catch (err) {
                    console.error('❌ Error updating history with try-on URL:', err);
                  }
                } else {
                  console.warn('⚠️ Missing data for history update:', {
                    hasUser: !!user,
                    hasHistoryEntryId: !!historyEntryId,
                    hasSelectedOutfit: !!selectedOutfit
                  });
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

  // Handle quick flow style name confirmation
  const handleQuickFlowNameConfirm = async (name: string) => {
    setQuickFlowStyleName(name);
    setShowQuickFlowNameModal(false);
    
    // Update history entry with style name if we have one
    if (user && historyEntryId) {
      try {
        await updateOutfitHistoryStyleName(
          user.id,
          historyEntryId,
          name
        );
        console.log('✅ Quick Flow style name saved:', name);
      } catch (err) {
        console.error('❌ Error updating Quick Flow style name:', err);
      }
    }
    
    setStep(5); // Go to purchase page
  };

  const handleQuickFlowNameCancel = () => {
    setShowQuickFlowNameModal(false);
    setStep(5); // Go to purchase page anyway
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="px-4 md:px-6 h-14 flex items-center w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col items-start py-2">
              <button 
                onClick={handleRestart}
                className="font-serif text-xl font-medium text-foreground tracking-wide hover:opacity-80 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
              >
                Praxis
              </button>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Get dressed right, in under a minute.
              </p>
            </div>
            <div className="flex items-center gap-3">
            {showStartOver && (
              <button
                onClick={handleRestart}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Start over
              </button>
            )}
            
            {/* Navigation - Desktop */}
            {isLoaded && user && !isMobile && (
              <nav className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="px-4"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="px-4"
                >
                  History
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/favorites')}
                  className="px-4"
                >
                  Favorites
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="px-4"
                >
                  My Style
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="px-4"
                >
                  Settings
                </Button>
              </nav>
            )}

            {/* Mobile Menu */}
            {isLoaded && user && isMobile && (
              <MobileNavMenu 
                navigate={navigate} 
                open={mobileMenuOpen} 
                onOpenChange={setMobileMenuOpen}
              />
            )}
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User actions */}
            {isLoaded && user && (
              <UserButton afterSignOutUrl="/" />
            )}
            
            {isLoaded && !user && (
              <SignInButton mode="modal">
                <Button variant="cta" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-16">
        {progress.show && (
          <div className="pt-4">
            <ProgressIndicator currentStep={progress.current} totalSteps={progress.total} />
          </div>
        )}
        {renderStep()}
      </main>

      {/* Quick Flow Style Name Modal */}
      <StyleNameModal
        open={showQuickFlowNameModal}
        onConfirm={handleQuickFlowNameConfirm}
        onCancel={handleQuickFlowNameCancel}
      />
    </div>
  );
};

export default Flow;
