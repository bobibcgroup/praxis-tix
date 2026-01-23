import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload, Video, Mic, SkipForward, Lock } from 'lucide-react';
import { praxisAgentOrchestrator } from '@/lib/praxisAgentOrchestrator';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

export default function AgentCapture() {
  const navigate = useNavigate();
  useSEO(); // Set SEO metadata for this route
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleVideoCapture = () => {
    videoInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Create object URL for preview (MVP - not uploaded to server)
      const objectUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');

      // Process attachment
      const context = praxisAgentOrchestrator.getContext();
      praxisAgentOrchestrator.processAttachment(
        {
          type: isVideo ? 'video' : 'photo',
          url: objectUrl,
        },
        context
      );

      toast.success(isVideo ? 'Video captured' : 'Photo captured');
      
      // Navigate to results
      setTimeout(() => {
        navigate('/agent/results');
      }, 500);
    } catch (error) {
      toast.error('Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    navigate('/agent/results');
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
                onClick={() => navigate('/agent')}
                className="shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-serif text-xl font-medium text-foreground tracking-wide">
                Optional: refine fit & color
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-8 px-4 max-w-md mx-auto">
        <div className="space-y-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePhotoCapture}
            disabled={isProcessing}
            className="w-full justify-start gap-3 h-14"
          >
            <Camera className="w-5 h-5" />
            <span>Take photo</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handlePhotoUpload}
            disabled={isProcessing}
            className="w-full justify-start gap-3 h-14"
          >
            <Upload className="w-5 h-5" />
            <span>Upload photo</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleVideoCapture}
            disabled={isProcessing}
            className="w-full justify-start gap-3 h-14"
          >
            <Video className="w-5 h-5" />
            <span>Record short video (5–10s)</span>
          </Button>

          <div className="pt-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleSkip}
              disabled={isProcessing}
              className="w-full justify-start gap-3 h-14"
            >
              <SkipForward className="w-5 h-5" />
              <span>Skip</span>
            </Button>
          </div>

          {/* Privacy notice */}
          <div className="pt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Private. Not shared.</span>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelected}
          className="hidden"
        />
      </main>
    </div>
  );
}
