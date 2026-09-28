import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };

export function Primary({ children, className = "", ...rest }: ButtonProps) {
  const reduced = useReducedMotion();
  return (
    <motion.button type="button" whileTap={reduced ? undefined : { scale: 0.98 }} className={`c-primary ${className}`} {...(rest as object)}>
      {children}
    </motion.button>
  );
}

export function Secondary({ children, className = "", ...rest }: ButtonProps) {
  const reduced = useReducedMotion();
  return (
    <motion.button type="button" whileTap={reduced ? undefined : { scale: 0.98 }} className={`c-secondary ${className}`} {...(rest as object)}>
      {children}
    </motion.button>
  );
}

export function Quiet({ children, className = "", ...rest }: ButtonProps) {
  return (
    <button type="button" className={`c-quiet ${className}`} {...rest}>
      {children}
    </button>
  );
}

interface DotsProps {
  labels: readonly string[];
  index: number;
  onIndex: (i: number) => void;
}

/** Position dots with 44 px targets; the current one stretches to a short bar. */
export function Dots({ labels, index, onIndex }: DotsProps) {
  const reduced = useReducedMotion();
  return (
    <div className="flex items-center" role="group" aria-label="Alternates">
      {labels.map((label, i) => {
        const current = i === index;
        return (
          <button key={label} type="button" aria-label={label} aria-current={current ? "true" : undefined} onClick={() => onIndex(i)} className="flex h-11 w-11 items-center justify-center">
            <motion.span
              aria-hidden="true"
              className={`block h-1.5 rounded-full ${current ? "bg-[var(--accent)]" : "bg-[var(--edge-strong)]"}`}
              initial={false}
              animate={{ width: current ? 20 : 6 }}
              transition={reduced ? { duration: 0.12 } : { type: "spring", stiffness: 300, damping: 30 }}
            />
          </button>
        );
      })}
    </div>
  );
}

/** A quiet transient confirmation line with a fixed height so nothing shifts. */
export function Status({ text }: { text: string | null }) {
  return (
    <p role="status" aria-live="polite" className="min-h-[20px] text-[14px] text-[var(--muted)]">
      {text}
    </p>
  );
}
