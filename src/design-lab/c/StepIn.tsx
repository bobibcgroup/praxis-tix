import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { readImageFile, useCamera } from "./capture";
import { KEEP_OPTION, STEP_IN_OPTIONS, UPLOAD_ERROR } from "./content";
import { Primary, Quiet, Status } from "./controls";
import Dial from "./Dial";
import type { Portrait } from "./journey";

interface StepInOptions {
  hasPortrait: boolean;
  question: string;
  /** null means keep the portrait already in the frame. */
  onDone: (portrait: Portrait | null) => void;
}

interface StepIn {
  rail: ReactNode;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}

/**
 * "Step in": camera behind a button, upload, or the stand-in. Owns the
 * camera lifecycle and renders the rail; the caller draws the frame.
 */
export function useStepIn({ hasPortrait, question, onDone }: StepInOptions): StepIn {
  const camera = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const options = hasPortrait ? [KEEP_OPTION, ...STEP_IN_OPTIONS] : STEP_IN_OPTIONS;

  const select = useCallback(
    (id: string) => {
      setChoice(id);
      setError(null);
      if (id === "keep") onDone(null);
      else if (id === "standin") onDone({ kind: "standin" });
      else if (id === "upload") fileRef.current?.click();
      else if (id === "camera") void camera.start();
    },
    [camera, onDone],
  );

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      onDone({ kind: "captured", dataUrl });
    } catch {
      setError(UPLOAD_ERROR);
    }
  };

  const captureNow = () => {
    const dataUrl = camera.capture(videoRef.current);
    if (!dataUrl) return;
    camera.stop();
    onDone({ kind: "captured", dataUrl });
  };

  const live = Boolean(camera.stream);
  const hint = options.find((o) => o.id === focused)?.hint ?? null;

  const rail = (
    <>
      <h1 className="sr-only">{question}</h1>
      {live ? (
        <div className="flex items-center gap-3">
          <Primary onClick={captureNow}>Capture</Primary>
          <Quiet onClick={camera.stop}>Cancel</Quiet>
        </div>
      ) : (
        <Dial label={question} options={options} selected={choice ? [choice] : []} onSelect={select} onFocusChange={setFocused} />
      )}
      <Status text={camera.error ?? error ?? (live ? "Face the light, then capture." : hint)} />
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
    </>
  );

  return { rail, stream: camera.stream, videoRef };
}
