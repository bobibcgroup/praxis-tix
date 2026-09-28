import { useEffect, useRef, useState } from "react";
import { SOURCE_LABEL, type CaptureValue } from "./model";
import { SecondaryButton, TextButton } from "./ui";

interface Props {
  /** What is being captured, for accessible names: "your face" or "your piece". */
  subject: string;
  sample: string;
  value: CaptureValue | null;
  onChange: (value: CaptureValue | null) => void;
  /** Aspect of the preview thumbnail. */
  portrait?: boolean;
  /** Replaces the source label once a value exists, e.g. the piece name. */
  label?: string;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * A small inline capture area. The camera only starts behind a button,
 * upload and "Use a sample" are always beside it, and errors are plain lines.
 */
export function Capture({ subject, sample, value, onChange, portrait = true, label }: Props) {
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLive(false);
  };

  useEffect(() => stop, []);

  useEffect(() => {
    if (live && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [live]);

  const startCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("No camera is available here. Upload a photo or use a sample.");
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setLive(true);
    } catch {
      setError("The camera could not start. Upload a photo or use a sample.");
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("The camera is still warming up. Try again in a moment.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const image = canvas.toDataURL("image/jpeg", 0.85);
    stop();
    onChange({ source: "camera", image });
  };

  const upload = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image. Choose a photo instead.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That photo is over 8 MB. Choose a smaller one.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange({ source: "upload", image: String(reader.result) });
    reader.onerror = () => setError("That photo could not be read. Try another.");
    reader.readAsDataURL(file);
  };

  const thumb = portrait ? "h-[70px] w-[56px]" : "h-[56px] w-[56px]";

  if (value) {
    return (
      <div className="flex items-center gap-4">
        <img src={value.image} alt={`${subject}, ${SOURCE_LABEL[value.source].toLowerCase()}`} className={`b-frame ${thumb} object-cover`} />
        <span className="b-mono min-w-0 flex-1 truncate text-[15px]">{label ?? SOURCE_LABEL[value.source]}</span>
        <TextButton onClick={() => onChange(null)} className="shrink-0 text-[13px]">
          Remove
        </TextButton>
      </div>
    );
  }

  if (live) {
    return (
      <div className="flex items-center gap-4">
        <video ref={videoRef} autoPlay playsInline muted aria-label={`Camera preview for ${subject}`} className="b-frame h-[140px] w-[112px] object-cover" />
        <div className="flex flex-col gap-2">
          <SecondaryButton onClick={takePhoto}>Take the photo</SecondaryButton>
          <TextButton onClick={stop} className="text-[13px]">
            Cancel
          </TextButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <SecondaryButton onClick={startCamera}>Use the camera</SecondaryButton>
        <SecondaryButton onClick={() => fileRef.current?.click()}>Upload a photo</SecondaryButton>
        <SecondaryButton onClick={() => onChange({ source: "sample", image: sample })}>Use a sample</SecondaryButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={`Upload a photo of ${subject}`}
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-[var(--muted)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
