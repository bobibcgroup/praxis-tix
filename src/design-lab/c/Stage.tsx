import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Dock from "./Dock";

interface StageProps {
  frame: ReactNode;
  rail: ReactNode;
  /** Occasion wash, also breathed faintly into the stage itself. */
  wash?: string | null;
  /** The sheet, positioned over the frame column. */
  sheet?: ReactNode;
}

/** Dark field, one centred frame, the rail beside or beneath it, the dock. */
export default function Stage({ frame, rail, wash, sheet }: StageProps) {
  const reduced = useReducedMotion();
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <AnimatePresence initial={false}>
        {wash && (
          <motion.div
            key={wash}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: wash }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.14 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.5 }}
          />
        )}
      </AnimatePresence>
      <div className="c-main relative">
        <div className="c-frame-slot relative">
          {frame}
          {sheet}
        </div>
        <div className="c-rail">{rail}</div>
        <Dock />
      </div>
    </div>
  );
}
