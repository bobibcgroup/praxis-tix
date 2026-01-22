import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle, Video, Download, Share2 } from 'lucide-react';
import FlowStep from './FlowStep';
import { generateVirtualTryOn } from '@/lib/virtualTryOnService';
import { generateAnimatedVideo } from '@/lib/videoGenerationService';
import { useUser } from '@clerk/clerk-react';
import type { Outfit, PersonalData } from '@/types/praxis';
import { toast } from 'sonner';

interface StepVirtualTryOnProps {
  outfit: Outfit;
  userPhoto?: string; // Base64 or URL
  personalData?: PersonalData;
  onBack: () => void;
  onComplete: (tryOnImageUrl: string, videoUrl?: string) => void;
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
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    // Generate try-on image on mount
    if (userPhoto && outfit.imageUrl) {
      generateTryOnImage();
    } else {
      setError('Photo or outfit image not available');
      setIsGenerating(false);
    }
  }, []);

  const generateTryOnImage = async () => {
    if (!userPhoto || !outfit.imageUrl) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateVirtualTryOn({
        userPhoto,
        outfitImage: outfit.imageUrl,
        outfitId: outfit.id,
        userId: user?.id,
      });

      setTryOnImage(result.imageUrl);
      setIsGenerating(false);
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
  };

  const handleGenerateVideo = async () => {
    if (!tryOnImage) return;

    setIsGeneratingVideo(true);
    setVideoError(null);

    try {
      const result = await generateAnimatedVideo({
        imageUrl: tryOnImage,
        outfitId: outfit.id,
        userId: user?.id,
      });

      setVideoUrl(result.videoUrl);
      setIsGeneratingVideo(false);
    } catch (err) {
      console.error('Video generation error:', err);
      setVideoError(err instanceof Error ? err.message : 'Failed to generate video');
      setIsGeneratingVideo(false);
      toast.error('Failed to generate video. Please try again.');
    }
  };

  const handleDownload = () => {
    if (!tryOnImage) return;

    const link = document.createElement('a');
    link.href = tryOnImage;
    link.download = `praxis-outfit-${outfit.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      onComplete(tryOnImage, videoUrl || undefined);
    }
  };

  return (
    <FlowStep title="Your personalized look">
      <div className="space-y-6">
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground text-center">
              Creating your personalized look...
            </p>
          </div>
        )}

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

            {/* Video Section */}
            {!videoUrl && !isGeneratingVideo && (
              <Button
                onClick={handleGenerateVideo}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Video className="w-4 h-4 mr-2" />
                See it animated
              </Button>
            )}

            {isGeneratingVideo && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating animation...</p>
              </div>
            )}

            {videoError && (
              <div className="text-sm text-destructive text-center">{videoError}</div>
            )}

            {videoUrl && (
              <div className="space-y-3">
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-xl border border-border"
                  autoPlay
                  loop
                />
              </div>
            )}

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
  );
};

export default StepVirtualTryOn;
