import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Look } from "../shared/catalog";

interface Props {
  look: Look;
  occasion: string;
  /** The user's portrait, shown inside the same frame once the rendering is ready. */
  portrait: string | null;
  rendered: boolean;
  /** Size classes for the frame; the caller decides per layout. */
  frameClass: string;
}

/** The bordered 4:5 hero frame. Try-on crossfades inside it; nothing moves around it. */
export function HeroFrame({ look, occasion, portrait, rendered, frameClass }: Props) {
  const reduced = useReducedMotion();
  const fade = { duration: reduced ? 0 : 0.5, ease: "easeOut" as const };

  return (
    <figure className="shrink-0">
      <div className={`b-frame ${frameClass}`}>
        <AnimatePresence initial={false}>
          <motion.img
            key={look.id}
            src={look.image}
            alt={`${look.title}, the hero look for ${occasion.toLowerCase()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <AnimatePresence>
          {rendered && portrait ? (
            <motion.img
              key="you"
              src={portrait}
              alt={`Rendered on you: ${look.title}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
        </AnimatePresence>
      </div>
      <figcaption className="mt-2 text-[12px] leading-none text-[var(--muted)]">{rendered ? "Rendered on you" : "The hero"}</figcaption>
    </figure>
  );
}
