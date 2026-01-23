import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload, Video, SkipForward, Lock, X } from 'lucide-react';
import { praxisAgentOrchestrator } from '@/lib/praxisAgentOrchestrator';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { analyzePhoto } from '@/lib/photoAnalysis';

export default function AgentCapture() {
  const navigate = useNavigate();
  useSEO(); // Set SEO metadata for this route
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);

  // Stop camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreamReady(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Start camera stream
  const startCameraStream = useCallback(async () => {
    setCameraError(null);
    setIsStreamReady(false);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera not supported in this browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 1600 },
        },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreamReady(true);
        };
      }
      
      return true;
    } catch (err) {
      console.log('Camera access error:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera permission denied.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No camera found on this device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError('Camera is in use by another application.');
        } else {
          setCameraError('Could not access camera.');
        }
      } else {
        setCameraError('Could not access camera.');
      }
      
      return false;
    }
  }, []);

  // Capture photo from video stream
  const captureFromStream = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Mirror for selfie
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    stopCameraStream();
    setShowCameraModal(false);
    
    handlePhotoProcessed(dataUrl, 'photo');
  }, [stopCameraStream]);

  const handlePhotoCapture = async () => {
    setShowCameraModal(true);
    const success = await startCameraStream();
    if (!success) {
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleVideoCapture = () => {
    videoInputRef.current?.click();
  };

  const handlePhotoProcessed = async (imageUrl: string, type: 'photo' | 'video') => {
    setIsProcessing(true);

    try {
      // Analyze photo if it's an image
      if (type === 'photo') {
        toast.info('Analyzing your photo...');
        try {
          const analysis = await analyzePhoto(imageUrl);
          if (analysis) {
            toast.success('Photo analyzed! Using it to personalize your looks.');
          }
        } catch (error) {
          console.error('Photo analysis error:', error);
          // Continue even if analysis fails
        }
      }

      // Process attachment (now async and analyzes photo)
      const context = praxisAgentOrchestrator.getContext();
      await praxisAgentOrchestrator.processAttachment(
        {
          type: type,
          url: imageUrl,
        },
        context
      );

      toast.success(type === 'video' ? 'Video captured' : 'Photo captured');
      
      // Navigate to results
      setTimeout(() => {
        navigate('/agent/results');
      }, 500);
    } catch (error) {
      console.error('Error processing attachment:', error);
      toast.error('Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      // Handle video
      const objectUrl = URL.createObjectURL(file);
      handlePhotoProcessed(objectUrl, 'video');
    } else {
      // Handle image upload
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        handlePhotoProcessed(result, 'photo');
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    e.target.value = '';
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

      {/* Camera Modal */}
      <Dialog open={showCameraModal} onOpenChange={(open) => {
        if (!open) {
          stopCameraStream();
          setShowCameraModal(false);
        }
      }}>
        <DialogContent className="max-w-md p-0 gap-0">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto max-h-[80vh] object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {cameraError && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                <div className="text-center text-white">
                  <p className="mb-4">{cameraError}</p>
                  <Button onClick={() => {
                    setShowCameraModal(false);
                    fileInputRef.current?.click();
                  }} variant="default">
                    Use File Instead
                  </Button>
                </div>
              </div>
            )}
            
            {!cameraError && (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => {
                      stopCameraStream();
                      setShowCameraModal(false);
                    }}
                    variant="outline"
                    size="lg"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={captureFromStream}
                    variant="default"
                    size="lg"
                    disabled={!isStreamReady}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Capture
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
