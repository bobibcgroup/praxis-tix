import { motion, useReducedMotion } from "motion/react";
import type { ButtonHTMLAttributes } from "react";

/** The only two icons in the concept: a chevron for the open line and a check for ticks. */
export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0 transition-transform duration-200 ease-out"
      style={{ transform: open ? "rotate(180deg)" : "none" }}
    >
      <path d="M3.5 6l4.5 4.5L12.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A check whose stroke draws in when `drawn` becomes true. */
export function Tick({ drawn }: { drawn: boolean }) {
  const reduced = useReducedMotion();
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <motion.path
        d="M3 8.5l3.2 3.2L13 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.24, ease: "easeOut" }}
      />
    </svg>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`b-primary transition-opacity duration-150 ${className}`} {...rest} />;
}

export function SecondaryButton({ className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`b-secondary transition-colors duration-150 ${className}`} {...rest} />;
}

export function TextButton({ className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`b-link transition-colors duration-150 ${className}`} {...rest} />;
}

interface SwatchesProps {
  palette: readonly string[];
  avoid?: readonly string[];
  size?: number;
  label?: string;
}

/** The DNA palette as plain squares. "Leave these" sits after a gap, no labels beyond that. */
export function Swatches({ palette, avoid = [], size = 40, label = "Your palette" }: SwatchesProps) {
  const box = { width: size, height: size };
  return (
    <div className="flex flex-wrap items-center gap-2" role="list" aria-label={label}>
      {palette.map((hex) => (
        <span key={hex} role="listitem" aria-label={`Colour ${hex}`} className="b-frame" style={{ ...box, background: hex }} />
      ))}
      {avoid.length ? (
        <>
          <span className="mx-1 text-[12px] leading-none text-[var(--muted)]">leave</span>
          {avoid.map((hex) => (
            <span key={hex} role="listitem" aria-label={`Leave colour ${hex}`} className="b-frame opacity-60" style={{ ...box, background: hex }} />
          ))}
        </>
      ) : null}
    </div>
  );
}
