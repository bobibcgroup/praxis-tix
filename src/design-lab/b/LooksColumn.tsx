import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { OCCASIONS, getLooks, type Look, type VibeId } from "../shared/catalog";
import { LookResult, type ResultLayout } from "./LookResult";
import { valueLabel, type BriefValues } from "./model";
import type { BriefController } from "./useBrief";

interface Props {
  c: BriefController;
  layout: ResultLayout;
}

const HERO_SIZE = { compact: "h-[220px] w-[176px]", full: "h-[min(52dvh,460px)] w-auto aspect-[4/5]" };
const ALT_SIZE = { compact: "h-[128px] w-[96px]", full: "h-[144px] w-[108px]" };
const TIER_FOR_FEEL: Record<VibeId, Look["tier"]> = { SAFE: "SAFEST", SHARP: "SHARPER", RELAXED: "RELAXED" };

/** The mood image that follows the brief: the occasion first, then the tier that matches the feel. */
function previewOf(values: BriefValues): { image: string | null; caption: string } {
  const occasion = OCCASIONS.find((o) => o.id === values.for);
  if (!occasion) return { image: null, caption: "" };
  const tier = values.feel ? TIER_FOR_FEEL[values.feel] : null;
  const tierImage = tier ? getLooks(occasion.id).find((look) => look.tier === tier)?.image : null;
  const caption = [occasion.label, valueLabel("feel", values)].filter(Boolean).join(", ");
  return { image: tierImage ?? occasion.image, caption };
}

interface PreviewProps {
  c: BriefController;
  compact: boolean;
  building: boolean;
  index: number;
}

/**
 * The column before results. The hero frame sits at its final position from
 * the first tap: empty with one line, then the occasion's mood image, darkened
 * for night, swapped when the feel changes. During the build the alternates'
 * frames appear as outlines in the order they will fill.
 */
function Preview({ c, compact, building, index }: PreviewProps) {
  const reduced = useReducedMotion();
  const size = compact ? "compact" : "full";
  const { image, caption } = previewOf(c.values);
  const night = image !== null && c.values.when === "NIGHT";
  const fade = { duration: reduced ? 0 : 0.28, ease: "easeOut" as const };
  const rise = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: fade };

  return (
    <div className="flex min-h-0 flex-col" aria-live="polite" aria-label={building ? "Composing your looks" : "A preview of your moment"}>
      <div className={compact ? "flex gap-4" : "flex gap-8"}>
        <figure className="shrink-0">
          <div className={`b-frame ${HERO_SIZE[size]}`}>
            <AnimatePresence initial={false}>
              {image ? (
                <motion.img
                  key={image}
                  src={image}
                  alt={`Mood for ${caption.toLowerCase()}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                  transition={fade}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
            </AnimatePresence>
            <motion.div
              aria-hidden="true"
              initial={false}
              animate={{ opacity: night ? 0.18 : 0 }}
              transition={fade}
              className="absolute inset-0 bg-[var(--ink)]"
            />
            {image ? null : (
              <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-[15px] leading-snug text-[var(--muted)]">
                Your three looks will appear here.
              </p>
            )}
          </div>
          <figcaption className="b-mono mt-2 min-h-[12px] text-[12px] leading-none text-[var(--muted)]">{caption}</figcaption>
        </figure>
      </div>
      <div className={compact ? "mt-5 flex flex-col gap-5" : "mt-6 grid grid-cols-2 gap-6 pt-5"}>
        <AnimatePresence>
          {building && index >= 3
            ? [0, 1].map((i) => (
                <motion.div key={i} {...rise} transition={{ ...fade, delay: reduced ? 0 : i * 0.12 }} className={`b-frame ${ALT_SIZE[size]}`} />
              ))
            : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Preview, building, result or try-on, decided by the controller's phase. */
export function LooksColumn({ c, layout }: Props) {
  const compact = layout === "compact";
  if (c.phase === "building") return <Preview c={c} compact={compact} building index={c.build.index} />;
  if (c.looks.length === 0) return <Preview c={c} compact={compact} building={false} index={0} />;
  return <LookResult c={c} layout={layout} />;
}
