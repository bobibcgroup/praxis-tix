import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ToneResult } from "../shared/catalog";
import { fitLabel, lifestyleLabel, presetLabels } from "./content";
import type { DnaAnswers } from "./journey";

interface SignatureProps {
  tones: ToneResult | null;
  answers: DnaAnswers;
  /** Reserve the strip's height even while empty (during the DNA journey). */
  reserve?: boolean;
}

/**
 * The signature strip: his tones and fit as a thin line under the frame.
 * It accumulates as he answers and, once saved, it is always there.
 */
export default function Signature({ tones, answers, reserve = false }: SignatureProps) {
  const reduced = useReducedMotion();
  const words = [fitLabel(answers.fit), lifestyleLabel(answers.lifestyle)?.toLowerCase(), ...presetLabels(answers.presetIds).map((l) => l.toLowerCase())].filter(
    (w): w is string => Boolean(w),
  );
  const empty = !tones && words.length === 0;
  if (empty && !reserve) return null;

  return (
    <div className="mt-2.5 flex h-6 w-full items-center justify-center gap-3 overflow-hidden lg:justify-start" aria-label="Your signature">
      <AnimatePresence initial={false}>
        {tones && (
          <motion.div
            key="tones"
            className="flex shrink-0 gap-[3px]"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.35 }}
            aria-label={`${tones.undertone} undertone, ${tones.contrast} contrast`}
            role="img"
          >
            {tones.palette.map((hex) => (
              <span key={hex} className="c-swatch h-[18px] w-[18px]" style={{ backgroundColor: hex }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false} mode="popLayout">
        {words.length > 0 && (
          <motion.p
            key={words.join("|")}
            className="truncate text-[14px] font-medium text-[var(--muted)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.35 }}
          >
            {words.join(", ")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
