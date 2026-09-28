/**
 * Inline capture for a face or a piece: camera behind a button (the preview
 * plays in the print), upload, or a sample. Never auto-starts the camera.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { captureFrame, fileToDataUrl, shrinkImage } from "./image";
import { faceCropStyle, type FaceValue } from "./model";
import { QuietButton, TextButton } from "./ui";

interface Props {
  subject: string;
  sample: string;
  value: FaceValue | null;
  onChange: (value: FaceValue | null) => void;
  /** Camera is offered for the face only. */
  camera?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
  onStream?: (stream: MediaStream | null) => void;
  /** Text shown next to a chosen value instead of an image (pieces without a photo). */
  label?: string;
}

const CAMERA_ERROR = "The camera is not available here. Upload a photo or use a sample instead.";

export function Capture({ subject, sample, value, onChange, camera = false, videoRef, onStream, label }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stop = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  useEffect(() => {
    onStream?.(stream);
  }, [stream, onStream]);

  useEffect(() => stop, [stop]);

  const openCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(CAMERA_ERROR);
      return;
    }
    try {
      setBusy(true);
      setStream(await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 1280, height: 960 }, audio: false }));
    } catch {
      setError(CAMERA_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = () => {
    const image = videoRef?.current ? captureFrame(videoRef.current) : null;
    if (!image) {
      setError("The camera has not started yet. Give it a second and try again.");
      return;
    }
    stop();
    onChange({ source: "own", image });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(`That file is not an image. Choose a photo of ${subject}.`);
      return;
    }
    try {
      setBusy(true);
      onChange({ source: "own", image: await shrinkImage(await fileToDataUrl(file)) });
    } catch {
      setError("The photo could not be read. Try another one.");
    } finally {
      setBusy(false);
    }
  };

  if (value) {
    return (
      <div className="flex items-center gap-3">
        {value.image && !label ? (
          <span className="block h-[56px] w-[42px] shrink-0 overflow-hidden">
            <img src={value.image} alt={`Your ${subject}`} className="h-full w-full object-cover object-top" style={faceCropStyle(value.image)} />
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-[15px]">{label ?? (value.source === "sample" ? "Sample" : value.source === "dna" ? "From your DNA" : "Your photo")}</span>
        <TextButton onClick={() => onChange(null)}>Remove</TextButton>
      </div>
    );
  }

  if (stream) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <QuietButton onClick={takePhoto}>Take the photo</QuietButton>
        <TextButton onClick={stop}>Cancel</TextButton>
        <span className="w-full text-[13px] text-[var(--muted)]">Face the light. The preview is in the frame.</span>
        {error && <p className="w-full text-[13px] text-[#B04040]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {camera && (
        <QuietButton onClick={openCamera} disabled={busy}>
          Use the camera
        </QuietButton>
      )}
      <QuietButton onClick={() => fileRef.current?.click()} disabled={busy}>
        Upload a photo
      </QuietButton>
      <QuietButton onClick={() => onChange({ source: "sample", image: sample })} disabled={busy}>
        Use a sample
      </QuietButton>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={`Upload a photo of ${subject}`}
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="w-full text-[13px] leading-snug text-[#B04040]">
          {error}
        </p>
      )}
    </div>
  );
}
