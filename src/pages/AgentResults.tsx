import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AgentChatInput } from '@/components/app/AgentChatInput';
import OutfitCard from '@/components/app/OutfitCard';
import StyleNameModal from '@/components/app/StyleNameModal';
import { praxisAgentOrchestrator } from '@/lib/praxisAgentOrchestrator';
import { saveOutfitToHistory, updateOutfitHistoryStyleName } from '@/lib/userService';
import { useUser } from '@clerk/clerk-react';
import type { Outfit, OccasionType } from '@/types/praxis';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { triggerConfettiBurst } from '@/lib/confetti';

export default function AgentResults() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  useSEO(); // Set SEO metadata for this route
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [historyEntryId, setHistoryEntryId] = useState<string | null>(null);
  const [showStyleNameModal, setShowStyleNameModal] = useState(false);

  useEffect(() => {
    // Generate outfits on mount
    const generate = async () => {
      setIsGenerating(true);
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const context = praxisAgentOrchestrator.getContext();
      const generated = praxisAgentOrchestrator.generateOutfits(context);
      
      setOutfits(generated);
      setIsGenerating(false);
    };

    generate();
  }, []);

  const handleChooseLook = async (outfitId: number) => {
    const outfit = outfits.find(o => o.id === outfitId);
    if (!outfit) return;

    setSelectedOutfit(outfit);
    
    // Store selection for analytics
    localStorage.setItem('praxis_selected_outfit', JSON.stringify({
      outfitId,
      mode: 'agent',
      timestamp: new Date().toISOString(),
    }));

    // Save to history if user is authenticated
    if (isLoaded && user) {
      try {
        const context = praxisAgentOrchestrator.getContext();
        const occasionValue = (context.occasion as OccasionType) || 'WORK';
        
        if (!occasionValue || occasionValue === '') {
          console.error('Invalid occasion value:', occasionValue);
          toast.error('Cannot save: Invalid occasion');
          return;
        }
        
        console.log('Saving Agent Flow outfit to history:', {
          userId: user.id,
          outfitId: outfit.id,
          outfitTitle: outfit.title,
          occasion: occasionValue
        });
        
        const entryId = await saveOutfitToHistory(
          user.id,
          outfit,
          occasionValue,
          undefined, // No try-on for Agent Flow (can add later)
          undefined,
          undefined, // styleName - will be set when user names it
          undefined,
          undefined,
          user.primaryEmailAddress?.emailAddress
        );
        
        setHistoryEntryId(entryId);
        
        if (entryId) {
          console.log('✅ Agent Flow outfit saved to history successfully:', entryId);
          toast.success('Outfit saved to history');
        } else {
          console.warn('⚠️ saveOutfitToHistory returned null');
          toast.error('Failed to save outfit to history');
        }
      } catch (err) {
        console.error('❌ Error saving Agent Flow outfit to history:', err);
        toast.error('Failed to save outfit to history');
      }
    }

    // Trigger confetti
    triggerConfettiBurst();

    // If user is signed in, show name modal, otherwise go to purchase
    if (isLoaded && user) {
      setShowStyleNameModal(true);
    } else {
      navigate('/agent/purchase', { state: { outfit } });
    }
  };

  const handleStyleNameConfirm = async (styleName: string) => {
    setShowStyleNameModal(false);
    
    // Update history entry with style name if we have one
    if (user && historyEntryId) {
      try {
        await updateOutfitHistoryStyleName(
          user.id,
          historyEntryId,
          styleName
        );
        console.log('✅ Agent Flow style name saved:', styleName);
      } catch (err) {
        console.error('❌ Error updating Agent Flow style name:', err);
      }
    }
    
    navigate('/agent/purchase', { state: { outfit: selectedOutfit } });
  };

  const handleStyleNameCancel = () => {
    setShowStyleNameModal(false);
    navigate('/agent/purchase', { state: { outfit: selectedOutfit } });
  };

  const handleRefine = async (refinementText: string) => {
    if (!refinementText.trim() || isRefining) return;

    setIsRefining(true);
    
    try {
      const context = praxisAgentOrchestrator.getContext();
      const refined = await praxisAgentOrchestrator.refineOutfits(context, refinementText);
      
      setOutfits(refined);
      toast.success('Looks updated based on your preferences');
    } catch (error) {
      console.error('Refinement error:', error);
      toast.error('Failed to refine looks. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleVoiceRecord = () => {
    // Navigate back to chat for voice
    navigate('/agent');
  };

  const handleAttachment = () => {
    navigate('/agent/capture');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="px-4 md:px-6 h-14 flex items-center w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/agent')}
                className="shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-serif text-xl font-medium text-foreground tracking-wide">
                Here are your looks
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-16 pb-24 overflow-y-auto">
        <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Generating your looks...</p>
            </div>
          ) : outfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Sparkles className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground">No outfits found. Try refining your request.</p>
            </div>
          ) : (
            <>
              {outfits.map((outfit) => (
                <div key={outfit.id} className="space-y-3">
                  <OutfitCard outfit={outfit} />
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => handleChooseLook(outfit.id)}
                      className="flex-1"
                    >
                      Choose this look
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRefine('Show alternatives')}
                      className="flex-1"
                    >
                      Refine
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}

          {isRefining && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Refining looks...
            </div>
          )}
        </div>
      </main>

      {/* Refine input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="px-4 py-2 text-xs text-muted-foreground text-center">
          Refine with Praxis Agent
        </div>
        <AgentChatInput
          onSendMessage={handleRefine}
          onVoiceRecord={handleVoiceRecord}
          onAttachment={handleAttachment}
          disabled={isRefining || isGenerating}
          placeholder="e.g., more formal, less black, hot weather..."
        />
      </div>

      {/* Style Name Modal */}
      <StyleNameModal
        open={showStyleNameModal}
        onConfirm={handleStyleNameConfirm}
        onCancel={handleStyleNameCancel}
      />
    </div>
  );
}
