import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, AlertCircle, X, User, Sun, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, SignInButton } from '@clerk/clerk-react';
import FlowStep from './FlowStep';
import PhotoCropModal from './PhotoCropModal';
import { analyzePhoto } from '@/lib/photoAnalysis';
import type { SkinToneData, ContrastLevel, BodyProportions, FaceShapeData } from '@/types/praxis';

interface PhotoAnalysisResult {
  originalPhoto: string;
  croppedPhoto: string;
  skinTone?: SkinToneData;
  contrastLevel?: ContrastLevel;
  bodyProportions?: BodyProportions;
  faceShape?: FaceShapeData;
}

interface StepPhotoProps {
  onPhotoConfirmed: (result: PhotoAnalysisResult) => void;
  onSkip: () => void;
  onBack?: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const StepPhoto = ({ onPhotoConfirmed, onSkip, onBack }: StepPhotoProps) => {
  const { user, isLoaded } = useUser();
  
  // State
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'camera' | 'upload' | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Start camera stream using getUserMedia
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

  // Check if image has ideal framing (head to mid-torso, centered)
  const checkIdealFraming = useCallback((imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        // Ideal portrait aspect is around 0.8 (4:5)
        // Accept range of 0.65-0.95 as "good enough"
        const isGoodAspect = aspectRatio >= 0.65 && aspectRatio <= 0.95;
        
        // For camera captures, we're more lenient since the user framed it themselves
        // Just check it's roughly portrait-oriented
        const isPortraitish = img.height > img.width;
        
        resolve(isGoodAspect || isPortraitish);
      };
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  }, []);

  // Process photo with smart auto-confirm
  const processPhotoWithAutoConfirm = useCallback(async (imageUrl: string, photoSource: 'camera' | 'upload') => {
    const isIdeal = await checkIdealFraming(imageUrl);
    
    if (isIdeal && photoSource === 'camera') {
      // Auto-confirm: skip crop, go directly to confirmation message
      setShowConfirmation(true);
      
      // After showing confirmation, proceed with analysis
      setTimeout(async () => {
        setShowConfirmation(false);
        setIsAnalyzing(true);
        
        try {
        const analysis = await analyzePhoto(imageUrl);
        
        const result: PhotoAnalysisResult = {
          originalPhoto: imageUrl,
          croppedPhoto: imageUrl,
          skinTone: analysis?.skinTone,
          contrastLevel: analysis?.contrastLevel,
          bodyProportions: analysis?.bodyProportions,
          faceShape: analysis?.faceShape,
        };
          
          onPhotoConfirmed(result);
        } catch {
          onPhotoConfirmed({ 
            originalPhoto: imageUrl, 
            croppedPhoto: imageUrl 
          });
        } finally {
          setIsAnalyzing(false);
        }
      }, 1000);
    } else {
      // Show crop modal as normal
      setRawPhoto(imageUrl);
      setSource(photoSource);
      setShowCropModal(true);
    }
  }, [checkIdealFraming, onPhotoConfirmed]);

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
    setError(null);
    
    // Use smart auto-confirm
    processPhotoWithAutoConfirm(dataUrl, 'camera');
  }, [stopCameraStream, processPhotoWithAutoConfirm]);

  // Cancel camera modal
  const cancelCameraModal = useCallback(() => {
    stopCameraStream();
    setShowCameraModal(false);
    setCameraError(null);
  }, [stopCameraStream]);

  // Fallback to file input
  const fallbackToFileInput = useCallback(() => {
    cancelCameraModal();
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, [cancelCameraModal]);

  // Validation helper
  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  // Process file and check for auto-confirm
  const processFile = (file: File, inputSource: 'camera' | 'upload') => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // For uploads, always show crop modal (user likely needs to adjust)
      setRawPhoto(result);
      setSource(inputSource);
      setShowCropModal(true);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Camera file input handler (fallback)
  const handleCameraChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (!file) return;
    setError(null);
    processFile(file, 'camera');
  }, []);

  // Upload file input handler
  const handleUploadChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (!file) return;
    setError(null);
    processFile(file, 'upload');
  }, []);

  // Take photo button
  const handleTakePhoto = useCallback(async () => {
    setError(null);
    setCameraError(null);
    setShowCameraModal(true);
    await startCameraStream();
  }, [startCameraStream]);

  // Upload photo button
  const handleUploadPhoto = useCallback(() => {
    setError(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
  }, []);

  // Handle crop confirmed - show confirmation then analyze
  const handleCropConfirmed = useCallback(async (croppedImageUrl: string) => {
    setShowCropModal(false);
    setShowConfirmation(true);
    
    // Show confirmation for 1 second, then proceed
    setTimeout(async () => {
      setShowConfirmation(false);
      setIsAnalyzing(true);
      
      try {
        const analysis = await analyzePhoto(croppedImageUrl);
        
        const result: PhotoAnalysisResult = {
          originalPhoto: rawPhoto || croppedImageUrl,
          croppedPhoto: croppedImageUrl,
          skinTone: analysis?.skinTone,
          contrastLevel: analysis?.contrastLevel,
          bodyProportions: analysis?.bodyProportions,
          faceShape: analysis?.faceShape,
        };
        
        onPhotoConfirmed(result);
      } catch {
        onPhotoConfirmed({ 
          originalPhoto: rawPhoto || croppedImageUrl, 
          croppedPhoto: croppedImageUrl 
        });
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000);
  }, [onPhotoConfirmed, rawPhoto]);

  // Handle retake from crop modal
  const handleRetakeFromCrop = useCallback(() => {
    setShowCropModal(false);
    setRawPhoto(null);
    setSource(null);
  }, []);

  // Handle cancel crop
  const handleCancelCrop = useCallback(() => {
    setShowCropModal(false);
    setRawPhoto(null);
    setSource(null);
  }, []);

  // Confirmation message screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <p className="text-xl font-medium text-foreground mb-2">Perfect.</p>
          <p className="text-muted-foreground">This helps us style you better.</p>
        </div>
      </div>
    );
  }

  // Crop modal
  if (showCropModal && rawPhoto && source) {
    return (
      <PhotoCropModal
        imageUrl={rawPhoto}
        onConfirm={handleCropConfirmed}
        onRetake={handleRetakeFromCrop}
        onCancel={handleCancelCrop}
        source={source}
      />
    );
  }

  // Analyzing state
  if (isAnalyzing) {
    return (
      <FlowStep 
        title="Let us see you (optional)"
        subtitle="This helps us choose the right colors and proportions for you."
      >
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">Analyzing your photo...</p>
        </div>
      </FlowStep>
    );
  }

  // Camera modal with framing overlay
  if (showCameraModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="flex items-center justify-between p-4 bg-black/80">
          <span className="text-white font-medium">Take a photo</span>
          <button
            type="button"
            onClick={cancelCameraModal}
            className="text-white p-2"
            aria-label="Cancel"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          {!cameraError && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* Ghost silhouette overlay - subtle guidance */}
              {isStreamReady && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Very subtle vignette */}
                  <div className="absolute inset-0" style={{ 
                    background: 'radial-gradient(ellipse 60% 70% at 50% 45%, transparent 0%, rgba(0,0,0,0.3) 100%)' 
                  }} />
                  
                  {/* Ghost silhouette - head and shoulders outline */}
                  <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[200px] h-[280px]">
                    {/* Head circle */}
                    <div 
                      className="absolute left-1/2 top-[15%] -translate-x-1/2 w-[80px] h-[95px] rounded-full"
                      style={{ 
                        border: '1.5px dashed rgba(255,255,255,0.25)',
                      }}
                    />
                    {/* Shoulders/torso curve */}
                    <div 
                      className="absolute left-1/2 top-[45%] -translate-x-1/2 w-[160px] h-[120px]"
                      style={{ 
                        border: '1.5px dashed rgba(255,255,255,0.25)',
                        borderRadius: '80px 80px 0 0',
                        borderBottom: 'none',
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
          
          {!cameraError && !isStreamReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white text-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Starting camera...</p>
              </div>
            </div>
          )}
          
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center p-6 max-w-sm">
                <AlertCircle className="w-12 h-12 text-white/60 mx-auto mb-4" />
                <p className="text-white mb-2">{cameraError}</p>
                <p className="text-white/60 text-sm mb-6">
                  Select Camera to take a photo, or upload from your gallery.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={fallbackToFileInput}
                    variant="outline"
                    size="lg"
                    className="w-full bg-white text-black hover:bg-white/90"
                  >
                    Use file picker
                  </Button>
                  <button
                    type="button"
                    onClick={cancelCameraModal}
                    className="w-full text-white/60 text-sm py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {!cameraError && (
          <div className="p-6 bg-black/80 flex flex-col items-center gap-3">
            {/* Guidance text */}
            {isStreamReady && (
              <p className="text-white/70 text-sm">Center yourself in the frame</p>
            )}
            <button
              type="button"
              onClick={captureFromStream}
              disabled={!isStreamReady}
              className="w-16 h-16 rounded-full bg-white border-4 border-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="Capture photo"
            >
              <div className="w-12 h-12 rounded-full bg-white" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Photo step - no sign-in prompt here, it will appear after inspiration selection

  // Selection mode
  return (
    <FlowStep 
      title="Optional: refine the fit"
      subtitle="This helps us choose the right colors and proportions for you."
      onBack={onBack}
    >
      <div className="space-y-4">
        {/* Privacy reassurance - moved higher */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <p className="text-xs text-muted-foreground text-center">
            Your photo is private and never shared.
          </p>
        </div>

        {/* Hidden file inputs */}
        <input
          id="cameraInput"
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleCameraChange}
          style={{ display: 'none' }}
          aria-label="Take photo with camera"
        />
        <input
          id="uploadInput"
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadChange}
          style={{ display: 'none' }}
          aria-label="Upload photo from device"
        />

        {/* Take photo button - dominant on mobile */}
        <button
          type="button"
          onClick={handleTakePhoto}
          className="w-full py-5 px-6 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 text-left transition-all flex items-center gap-4"
        >
          <Camera className="w-6 h-6 text-primary" />
          <span className="text-lg font-medium text-foreground">Take photo</span>
        </button>

        {/* Upload photo button */}
        <button
          type="button"
          onClick={handleUploadPhoto}
          className="w-full py-4 px-6 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-muted/30 text-left transition-all flex items-center gap-4"
        >
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-lg text-foreground">Upload photo</span>
        </button>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Skip button - clear and guilt-free */}
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-4 text-center text-muted-foreground hover:text-foreground transition-colors text-base font-medium"
        >
          Skip this step
        </button>
      </div>
    </FlowStep>
  );
};

export default StepPhoto;
