import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Download, Share2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FlowStep from './FlowStep';
import StyleNameModal from './StyleNameModal';
import { generateVirtualTryOn } from '@/lib/virtualTryOnService';
import { useUser } from '@clerk/clerk-react';
import type { Outfit, PersonalData, StyleDNA } from '@/types/praxis';
import { toast } from 'sonner';
import { getRecommendedSwatches } from '@/lib/personalOutfitGenerator';

interface StepVirtualTryOnProps {
  outfit: Outfit;
  userPhoto?: string; // Base64 or URL
  personalData?: PersonalData;
  onBack: () => void;
  onComplete: (tryOnImageUrl: string, styleName?: string) => void;
  onSkip?: () => void;
}

const StepVirtualTryOn = ({
  outfit,
  userPhoto,
  personalData,
  onBack,
  onComplete,
  onSkip,
}: StepVirtualTryOnProps) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [styleName, setStyleName] = useState<string | null>(null);
  const [generationStarted, setGenerationStarted] = useState(false);

  // Show name modal first before starting generation
  useEffect(() => {
    if (userPhoto && outfit.imageUrl && !generationStarted) {
      setShowNameModal(true);
    } else if (!userPhoto || !outfit.imageUrl) {
      setError('Photo or outfit image not available');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNameConfirm = (name: string) => {
    setStyleName(name);
    setShowNameModal(false);
    setGenerationStarted(true);
    generateTryOnImage(name);
  };

  const handleNameCancel = () => {
    setShowNameModal(false);
    if (onSkip) {
      onSkip();
    }
  };

  const generateTryOnImage = async (name?: string) => {
    if (!userPhoto || !outfit.imageUrl) return;

    setIsGenerating(true);
    setError(null);

    // Store generation in background - allow navigation to dashboard
    const generationPromise = (async () => {
      try {
        const result = await generateVirtualTryOn({
          userPhoto,
          outfitImage: outfit.imageUrl,
          outfitId: outfit.id,
          userId: user?.id,
        });

        setTryOnImage(result.imageUrl);
        setIsGenerating(false);
        
        // If user navigated away, show notification when done
        if (document.hidden) {
          toast.success('Your style image is ready!');
        }
      } catch (err) {
        console.error('Try-on generation error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate try-on image';
        
        // Check for specific error types
        if (errorMessage.includes('Rate limit') || errorMessage.includes('429') || errorMessage.includes('payment method')) {
          setError('Rate limit exceeded. Please add a payment method to your Replicate account to increase limits. Visit: https://replicate.com/account/billing. Your outfit selection is still perfect—continue to see your Style DNA.');
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          setError('Cannot reach server. Please check that the serverless function is deployed and REPLICATE_API_TOKEN is set in Vercel.');
        } else if (errorMessage.includes('Server error')) {
          setError(`Server error: ${errorMessage}. Check Vercel function logs.`);
        } else if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control-Allow-Origin')) {
          setError('CORS error. Serverless function may not be configured correctly.');
        } else {
          setError(`Unable to generate preview: ${errorMessage}. Your outfit selection is still perfect—continue to see your Style DNA.`);
        }
        setIsGenerating(false);
      }
    })();

    // Don't await - allow async generation
    generationPromise;
  };

  const handleDownload = async () => {
    if (!tryOnImage) return;

    try {
      // Fetch the image as a blob to handle CORS
      const response = await fetch(tryOnImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `praxis-outfit-${outfit.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const handleShare = async () => {
    if (!tryOnImage) return;

    if (navigator.share) {
      try {
        const response = await fetch(tryOnImage);
        const blob = await response.blob();
        const file = new File([blob], `praxis-outfit-${outfit.id}.jpg`, { type: 'image/jpeg' });

        await navigator.share({
          title: `My ${outfit.title} look`,
          text: `Check out my outfit recommendation from Praxis`,
          files: [file],
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(tryOnImage);
        toast.success('Image URL copied to clipboard');
      } catch (err) {
        toast.error('Failed to share');
      }
    }
  };

  const handleContinue = () => {
    if (tryOnImage) {
      onComplete(tryOnImage, styleName || undefined);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  // Funny loading animation component
  const LoadingAnimation = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative w-32 h-32">
        {/* Person changing clothes animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </div>
        {/* Clothes icons floating */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDelay: '0s' }}>
          <div className="w-8 h-8 bg-primary/30 rounded rotate-12" />
        </div>
        <div className="absolute bottom-0 right-0 animate-bounce" style={{ animationDelay: '0.3s' }}>
          <div className="w-6 h-6 bg-primary/30 rounded -rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 animate-bounce" style={{ animationDelay: '0.6s' }}>
          <div className="w-7 h-7 bg-primary/30 rounded rotate-45" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">
          Getting you dressed...
        </p>
        <p className="text-sm text-muted-foreground">
          This might take a moment. Feel free to explore while we work!
        </p>
      </div>
      <Button
        onClick={handleGoToDashboard}
        variant="outline"
        size="lg"
        className="mt-4"
      >
        <ArrowRight className="w-4 h-4 mr-2" />
        Go to Dashboard
      </Button>
    </div>
  );

  return (
    <>
      <StyleNameModal
        open={showNameModal}
        onConfirm={handleNameConfirm}
        onCancel={handleNameCancel}
      />
      <FlowStep title="Your personalized look">
        <div className="space-y-6">
          {isGenerating && <LoadingAnimation />}

        {error && !isGenerating && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground mb-2 font-medium">
                  Preview unavailable
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {error.includes('CORS') 
                    ? 'Virtual try-on requires server-side setup. Your outfit selection is perfect—continue to see your Style DNA!'
                    : 'Unable to generate preview right now. Your outfit selection is still perfect for you!'
                  }
                </p>
                {onSkip && (
                  <Button onClick={onSkip} variant="cta" size="sm" className="w-full">
                    Continue to Style DNA
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {tryOnImage && !isGenerating && (
          <div className="space-y-6">
            {/* Generated Try-On Image */}
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={tryOnImage}
                alt={`${outfit.title} - Personalized`}
                className="w-full h-auto"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Continue Button */}
            <div className="flex gap-3 pt-4">
              <Button onClick={onBack} variant="outline" size="lg" className="flex-1">
                Back
              </Button>
              <Button onClick={handleContinue} variant="cta" size="lg" className="flex-[2]">
                This is perfect
              </Button>
            </div>
          </div>
        )}

        {!tryOnImage && !isGenerating && !error && onSkip && (
          <Button onClick={onSkip} variant="cta" size="lg" className="w-full">
            Continue without preview
          </Button>
        )}
      </div>
    </FlowStep>
    </>
  );
};

export default StepVirtualTryOn;
