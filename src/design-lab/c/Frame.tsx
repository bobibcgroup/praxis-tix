import { useEffect, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { TimeId } from "../shared/catalog";
import type { OwnedPiece } from "./journey";
import Ring from "./Ring";

interface FrameProps {
  image: string;
  alt: string;
  /** Live camera preview, drawn over the image while present. */
  stream?: MediaStream | null;
  videoRef?: RefObject<HTMLVideoElement>;
  wash?: string | null;
  light?: TimeId | null;
  /** A catalog look laid over the darkened portrait: the photographic preview of the look forming. */
  ghost?: string | null;
  piece?: OwnedPiece | "none" | null;
  /** Display caption on the lower edge, Bricolage. */
  caption?: string | null;
  /** Small factual note under the caption, e.g. "Rendered on you". */
  note?: string | null;
  ring?: { progress: number; active: boolean };
  dim?: boolean;
  children?: ReactNode;
}

/**
 * The one object on the stage. Every answer changes a layer of it; the
 * portrait itself never moves.
 */
export default function Frame({ image, alt, stream, videoRef, wash, light, ghost, piece, caption, note, ring, dim, children }: FrameProps) {
  const reduced = useReducedMotion();
  const fade = { duration: reduced ? 0.12 : 0.35 };
  const cross = { duration: reduced ? 0.12 : 0.6 };
  const ownPiece = piece && piece !== "none" ? piece : null;
  const night = light === "NIGHT";

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;
    video.srcObject = stream ?? null;
    if (stream) void video.play().catch(() => undefined);
  }, [stream, videoRef]);

  return (
    <div className="c-frame-size relative">
      <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-[var(--sheet)]">
        <AnimatePresence initial={false}>
          <motion.img
            key={image}
            src={image}
            alt={alt}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={cross}
          />
        </AnimatePresence>

        {stream && videoRef && (
          <video ref={videoRef} muted playsInline autoPlay aria-label="Live camera preview" className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
        )}

        <AnimatePresence initial={false}>
          {wash && (
            <motion.div
              key={wash}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ backgroundColor: wash, mixBlendMode: "multiply" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={fade}
            />
          )}
        </AnimatePresence>

        {/* Day: a soft lift. Night: a light veil plus a cool shift, evening light rather than a dimmed screen. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "#F2EFE8", mixBlendMode: "soft-light" }}
          initial={false}
          animate={{ opacity: light === "DAY" ? 0.55 : 0 }}
          transition={fade}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "#0C1220", mixBlendMode: "multiply" }}
          initial={false}
          animate={{ opacity: night ? 0.12 : 0 }}
          transition={fade}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "#5B7BB5", mixBlendMode: "color" }}
          initial={false}
          animate={{ opacity: night ? 0.22 : 0 }}
          transition={fade}
        />

        {/* The ghost: portrait down to 40 percent, the matching look over it at 45 percent, same crop. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[var(--stage)]"
          initial={false}
          animate={{ opacity: ghost ? 0.6 : dim ? 0.4 : 0 }}
          transition={fade}
        />
        <AnimatePresence initial={false}>
          {ghost && (
            <motion.img
              key={ghost}
              src={ghost}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={fade}
            />
          )}
        </AnimatePresence>

        {(caption || note) && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]" style={{ background: "linear-gradient(to top, rgba(20,21,22,0.82), rgba(20,21,22,0))" }} />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 lg:p-5">
          <AnimatePresence initial={false} mode="popLayout">
            {caption && (
              <motion.p
                key={caption}
                className="c-display text-[22px] text-[var(--text)] lg:text-[26px]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={fade}
              >
                {caption}
              </motion.p>
            )}
          </AnimatePresence>
          {note && <p className="text-[14px] font-medium text-[var(--text)] opacity-85">{note}</p>}
        </div>

        <AnimatePresence>
          {ownPiece && (
            <motion.figure
              key="piece"
              className="absolute right-3 top-3 h-16 w-16 overflow-hidden rounded-xl border border-[var(--edge-strong)] bg-[var(--sheet)]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={reduced ? { duration: 0.12 } : { type: "spring", stiffness: 300, damping: 30 }}
            >
              <img src={ownPiece.image} alt={`Your piece: ${ownPiece.name}`} className="h-full w-full object-cover" draggable={false} />
            </motion.figure>
          )}
        </AnimatePresence>

        <Ring progress={ring?.progress ?? 0} active={Boolean(ring?.active)} />

        {children}
      </div>
    </div>
  );
}
