import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlowStep from './FlowStep';
import { useUser } from '@clerk/clerk-react';

const API_BASE = typeof window !== 'undefined' ? (import.meta.env.VITE_API_BASE ?? '') : '';

type Phase = 'face' | 'body';

interface StepQuickPhotoCaptureProps {
  onDone: () => void;
  onBack: () => void;
}

async function startBiometricsSession(userId: string, flow: 'occasion' | 'dna'): Promise<string> {
  const res = await fetch(`${API_BASE}/api/biometrics/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, flow }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.error || 'Failed to start session');
  }
  const data = await res.json();
  return data.session_id;
}

async function uploadFaceImage(sessionId: string, imageBase64: string): Promise<{ accepted: boolean; reject_reason?: string; how_to_fix?: string }> {
  const res = await fetch(`${API_BASE}/api/biometrics/session/face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, image: imageBase64 }),
  });
  const data = await res.json();
  return { accepted: data.accepted !== false, reject_reason: data.reject_reason, how_to_fix: data.how_to_fix };
}

async function uploadBodyImage(sessionId: string, imageBase64: string): Promise<{ accepted: boolean; reject_reason?: string; how_to_fix?: string }> {
  const res = await fetch(`${API_BASE}/api/biometrics/session/body`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, image: imageBase64 }),
  });
  const data = await res.json();
  return { accepted: data.accepted !== false, reject_reason: data.reject_reason, how_to_fix: data.how_to_fix };
}

async function finalizeSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/biometrics/session/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error('Failed to finalize');
}

const StepQuickPhotoCapture = ({ onDone, onBack }: StepQuickPhotoCaptureProps) => {
  const { user } = useUser();
  const [phase, setPhase] = useState<Phase>('face');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [howToFix, setHowToFix] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = user?.id ?? 'anonymous';

  // Start session when mounting
  useEffect(() => {
    let cancelled = false;
    startBiometricsSession(userId, 'occasion')
      .then((id) => {
        if (!cancelled) setSessionId(id);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Could not start photo session');
      });
    return () => { cancelled = true; };
  }, [userId]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraReady(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    setHowToFix(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: phase === 'face' ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
      setShowCamera(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not access camera');
    }
  }, [phase]);

  const captureFromCamera = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    submitImage(dataUrl);
  }, [stopCamera, submitImage]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      setHowToFix(null);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        submitImage(dataUrl);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [submitImage]
  );

  const submitImage = useCallback(
    async (imageBase64: string) => {
      if (!sessionId) {
        setError('Session not ready');
        return;
      }
      setLoading(true);
      setError(null);
      setHowToFix(null);
      try {
        if (phase === 'face') {
          const result = await uploadFaceImage(sessionId, imageBase64);
          if (!result.accepted) {
            setError(result.reject_reason || 'Face photo was not accepted');
            setHowToFix(result.how_to_fix ?? null);
            return;
          }
          setPhase('body');
        } else {
          const result = await uploadBodyImage(sessionId, imageBase64);
          if (!result.accepted) {
            setError(result.reject_reason || 'Body photo was not accepted');
            setHowToFix(result.how_to_fix ?? null);
            return;
          }
          await finalizeSession(sessionId);
          onDone();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setLoading(false);
      }
    },
    [sessionId, phase, onDone]
  );

  const handleBack = () => {
    if (phase === 'body') {
      setPhase('face');
      setError(null);
      setHowToFix(null);
    } else {
      onBack();
    }
  };

  const isFace = phase === 'face';
  const title = isFace ? 'Face photo (color accuracy)' : 'Full-body photo (fit + silhouette)';
  const subtitle = isFace
    ? 'Natural light is best. No filters. No strong shadows.'
    : 'Stand straight. Against a plain wall if possible.';

  if (!sessionId && !error) {
    return (
      <FlowStep title="Preparing...">
        <p className="text-muted-foreground text-center">Starting photo session...</p>
      </FlowStep>
    );
  }

  if (showCamera) {
    return (
      <FlowStep title={title} subtitle={subtitle}>
        <div className="space-y-4">
          <div className="relative aspect-[4/3] max-w-md mx-auto rounded-lg overflow-hidden bg-muted">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={stopCamera}>
              Cancel
            </Button>
            <Button variant="cta" className="flex-1" onClick={captureFromCamera} disabled={!cameraReady}>
              Capture
            </Button>
          </div>
        </div>
      </FlowStep>
    );
  }

  return (
    <FlowStep title={title} subtitle={subtitle} onBack={handleBack}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
            {howToFix && <p className="mt-1 text-muted-foreground">{howToFix}</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          We extract measurements and delete raw photos unless you choose to save them.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col gap-3">
          <Button
            variant="cta"
            size="lg"
            className="w-full"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {loading ? 'Uploading...' : 'Upload photo'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={loading}
            onClick={startCamera}
          >
            <Camera className="w-4 h-4 mr-2" />
            Take photo
          </Button>
        </div>
      </div>
    </FlowStep>
  );
};

export default StepQuickPhotoCapture;
