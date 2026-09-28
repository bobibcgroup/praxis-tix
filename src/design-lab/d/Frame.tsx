/**
 * The living print. It never leaves the page: images crossfade inside it,
 * the night veil and the rebuild dim are layers, the camera preview and the
 * try-on wipe are layers, and whatever sits under it (hairline, thumbnails)
 * is part of the same block so the print sizes itself around them.
 */
import type { CSSProperties, ReactNode, RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface FrameProps {
  image: string | null;
  alt: string;
  /** Muted slices shown while the print is empty. */
  preview?: readonly { image: string }[];
  night?: boolean;
  dim?: boolean;
  liveRef?: RefObject<HTMLVideoElement>;
  live?: boolean;
  overlay?: ReactNode;
  reduced: boolean;
  /** Rows under the print: hairline, thumbnails, caption. */
  below?: ReactNode;
  /** Height reserved under the print, in px. */
  belowHeight?: number;
}

const FADE = { duration: 0.4, ease: "easeOut" as const };

export function Frame({ image, alt, preview, night = false, dim = false, liveRef, live = false, overlay, reduced, below, belowHeight = 0 }: FrameProps) {
  const fade = reduced ? { duration: 0 } : FADE;
  const style = { "--below": `${belowHeight}px` } as CSSProperties;

  return (
    <div className="d-frame-room">
      <div className="d-print" style={style}>
        <motion.div className="d-frame" initial={false} animate={{ opacity: dim ? 0.6 : 1 }} transition={{ duration: reduced ? 0 : 0.2 }} aria-busy={dim}>
          <div className="d-frame-inner relative h-full w-full overflow-hidden bg-[var(--surface)]">
            <AnimatePresence initial={false}>
              {preview && !image && !live && (
                <motion.div
                  key="preview"
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade}
                  className="absolute inset-0 grid grid-cols-5 gap-1 bg-[var(--bg)]"
                >
                  {preview.map((slice) => (
                    <img key={slice.image} src={slice.image} alt="" className="h-full w-full object-cover object-top opacity-55" draggable={false} />
                  ))}
                </motion.div>
              )}
              {image && !live && (
                <motion.img
                  key={image}
                  src={image}
                  alt={alt}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  draggable={false}
                />
              )}
            </AnimatePresence>

            {liveRef && (
              <video
                ref={liveRef}
                playsInline
                muted
                autoPlay
                aria-label="Camera preview"
                className={`absolute inset-0 h-full w-full object-cover ${live ? "opacity-100" : "opacity-0"}`}
                style={{ transform: "scaleX(-1)" }}
              />
            )}

            <motion.div
              aria-hidden
              initial={false}
              animate={{ opacity: night ? 0.14 : 0 }}
              transition={fade}
              className="pointer-events-none absolute inset-0 bg-[#1f2a3d] mix-blend-multiply"
            />

            {overlay}
          </div>
        </motion.div>
        {below}
      </div>
    </div>
  );
}

interface HairlineProps {
  /** Number of segments; one continuous line when omitted. */
  segments?: number;
  filled?: number;
  /** 0 to 1 for the continuous line. */
  progress?: number;
  label: string;
  reduced: boolean;
}

/** The progress hairline under the print: six 2 px segments with the count on the left; one continuous line while a build runs. */
export function Hairline({ segments, filled = 0, progress = 0, label, reduced }: HairlineProps) {
  return (
    <div className="d-segments" aria-live="polite">
      <span className="count d-num">{label}</span>
      {segments ? (
        <div className={segments === 4 ? "track four" : "track"} role="img" aria-label={label}>
          {Array.from({ length: segments }, (_, i) => (
            <span key={i} className={i < filled ? "seg done" : "seg"} />
          ))}
        </div>
      ) : (
        <div className="line" role="img" aria-label={label}>
          <motion.div initial={false} animate={{ scaleX: progress }} transition={{ duration: reduced ? 0 : 0.2, ease: "linear" }} />
        </div>
      )}
    </div>
  );
}

