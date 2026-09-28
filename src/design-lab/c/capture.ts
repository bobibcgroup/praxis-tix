/**
 * Camera and upload helpers. The camera only starts behind a button and is
 * always stopped on unmount. Captures are downscaled to a 3:4 JPEG so they
 * fit sessionStorage comfortably.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { CAMERA_ERROR, UPLOAD_ERROR } from "./content";

const OUT_W = 600;
const OUT_H = 800;

function drawCover(ctx: CanvasRenderingContext2D, source: CanvasImageSource, sw: number, sh: number, mirror: boolean): void {
  const scale = Math.max(OUT_W / sw, OUT_H / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (OUT_W - dw) / 2;
  const dy = (OUT_H - dh) / 2;
  if (mirror) {
    ctx.translate(OUT_W, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, dx, dy, dw, dh);
}

function toJpeg(draw: (ctx: CanvasRenderingContext2D) => void): string {
  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  draw(ctx);
  return canvas.toDataURL("image/jpeg", 0.86);
}

/** Reads an image file into a downscaled 3:4 JPEG data URL. */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        resolve(toJpeg((ctx) => drawCover(ctx, img, img.naturalWidth, img.naturalHeight, false)));
      } catch {
        reject(new Error(UPLOAD_ERROR));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(UPLOAD_ERROR));
    };
    img.src = url;
  });
}

export interface CameraApi {
  stream: MediaStream | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  capture: (video: HTMLVideoElement | null) => string | null;
}

export function useCamera(): CameraApi {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(CAMERA_ERROR);
      return;
    }
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = next;
      setStream(next);
    } catch {
      setError(CAMERA_ERROR);
    }
  }, []);

  const capture = useCallback((video: HTMLVideoElement | null): string | null => {
    if (!video || video.videoWidth === 0) return null;
    try {
      return toJpeg((ctx) => drawCover(ctx, video, video.videoWidth, video.videoHeight, true));
    } catch {
      setError(CAMERA_ERROR);
      return null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { stream, error, start, stop, capture };
}
