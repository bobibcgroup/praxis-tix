import { motion, useReducedMotion } from "motion/react";
import type { BuildStage } from "../shared/guided";
import { Tick } from "./ui";

interface Props {
  stages: readonly BuildStage[];
  /** Index of the running stage; stages.length when the build is done. */
  index: number;
  label: string;
}

/**
 * The choreographed wait, printed as lines. Each stage appears when it starts
 * and its tick draws in when it completes. Nothing spins.
 */
export function StageLines({ stages, index, label }: Props) {
  const reduced = useReducedMotion();
  const visible = stages.slice(0, Math.min(stages.length, index + 1));
  return (
    <ol className="d-mono text-[13px]" aria-label={label} aria-live="polite">
      {visible.map((stage, i) => {
        const done = i < index;
        return (
          <motion.li
            key={stage.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.12, ease: "easeOut" }}
            className={`flex h-6 items-center gap-2 transition-colors duration-200 ${done ? "text-[var(--text)]" : "text-[var(--accent)]"}`}
          >
            <span className="flex h-4 w-4 items-center justify-center text-[var(--accent)]" aria-hidden="true">
              {done ? <Tick drawn /> : <span className="block h-[10px] w-[10px] rounded-[3px] border border-current" />}
            </span>
            <span className="leading-none">{stage.label}</span>
            {done ? <span className="sr-only">done</span> : null}
          </motion.li>
        );
      })}
    </ol>
  );
}
