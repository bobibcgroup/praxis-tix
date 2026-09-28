import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { Chevron } from "./ui";

interface Props {
  id: string;
  label: string;
  /** The typed value, shown in mono. Null renders an empty line. */
  value: string | null;
  /** A quiet note about where a prefilled value came from. */
  note?: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

/**
 * One line of the brief. The row is a button that expands its options in
 * place; choosing an option is the caller's job and collapses the line.
 */
export function BriefLine({ id, label, value, note, open, onToggle, children }: Props) {
  const reduced = useReducedMotion();
  return (
    <div className="border-b border-[var(--rule)]">
      <button
        type="button"
        id={`line-${id}`}
        aria-expanded={open}
        aria-controls={`panel-${id}`}
        onClick={onToggle}
        className={`flex h-14 w-full items-center gap-4 text-left transition-colors duration-150 ${
          open ? "text-[var(--accent)]" : "text-[var(--ink)]"
        }`}
      >
        <span className="w-[76px] shrink-0 text-[13px] font-medium leading-none">{label}</span>
        <span className="b-mono min-w-0 flex-1 truncate text-[17px] leading-none">{value ?? ""}</span>
        {note ? <span className="hidden shrink-0 text-[12px] leading-none text-[var(--muted)] sm:inline">{note}</span> : null}
        <Chevron open={open} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            id={`panel-${id}`}
            role="region"
            aria-labelledby={`line-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pb-4 pt-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
