import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { SavedDna } from "../shared/store";
import { dnaSummary } from "./model";
import { Chevron, Swatches, TextButton } from "./ui";

interface Props {
  dna: SavedDna;
  expanded: boolean;
  onToggle: () => void;
  onRedo: () => void;
  onRemove: () => void;
}

/** The saved DNA as a header line on the brief. Expands to the palette and the two ways to change it. */
export function DnaHeader({ dna, expanded, onToggle, onRedo, onRemove }: Props) {
  const reduced = useReducedMotion();
  return (
    <div className="border-b border-[var(--rule)]">
      <button
        type="button"
        id="line-dna"
        aria-expanded={expanded}
        aria-controls="panel-dna"
        onClick={onToggle}
        className={`flex h-14 w-full items-center gap-4 text-left transition-colors duration-150 ${expanded ? "text-[var(--accent)]" : ""}`}
      >
        <span className="w-[76px] shrink-0 text-[13px] font-medium leading-none">Your DNA</span>
        <span className="b-mono min-w-0 flex-1 truncate text-[17px] leading-none">{dnaSummary(dna)}</span>
        <Chevron open={expanded} />
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="panel"
            id="panel-dna"
            role="region"
            aria-labelledby="line-dna"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-4 pb-4 pt-1">
              {dna.portrait ? <img src={dna.portrait} alt="Your portrait" className="b-frame h-[70px] w-[56px] shrink-0 object-cover" /> : null}
              <div className="min-w-0 flex-1">
                <Swatches palette={dna.tones.palette} avoid={dna.tones.avoid} size={24} />
                <p className="mt-2 text-[13px] leading-snug text-[var(--muted)]">{dna.tones.line}</p>
                <div className="mt-3 flex gap-5">
                  <TextButton onClick={onRedo} className="text-[13px]">
                    Redo
                  </TextButton>
                  <TextButton onClick={onRemove} className="text-[13px]">
                    Remove
                  </TextButton>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
