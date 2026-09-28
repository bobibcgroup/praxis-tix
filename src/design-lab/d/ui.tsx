/** Primitives built to the Hairline rules: 44 px controls, text centred by the box, one baseline for label and hint. */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`d-control d-primary ${className}`} {...rest} />;
}

export function QuietButton({ className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`d-control d-secondary ${className}`} {...rest} />;
}

export function TextButton({ className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`d-control d-tertiary ${className}`} {...rest} />;
}

export function Caption({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[13px] leading-snug text-[var(--muted)] ${className}`}>{children}</p>;
}

/** The 16 px chevron that lives in the brief line's 24 px column. */
export function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A tick that draws itself when a stage completes. */
export function Tick({ drawn }: { drawn: boolean }) {
  const reduced = useReducedMotion();
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <motion.path
        d="M2.5 7.5 5.5 10.5 11.5 4"
        fill="none"
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

interface SwatchesProps {
  palette: string[];
  avoid?: string[];
  size?: number;
}

export function Swatches({ palette, avoid = [], size = 32 }: SwatchesProps) {
  const box = { width: size, height: size };
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[13px] text-[var(--muted)]">Wear near your face</p>
        <ul className="flex gap-2" aria-label="Your palette">
          {palette.map((hex) => (
            <li key={hex} className="d-swatch" style={{ ...box, background: hex }} title={hex} />
          ))}
        </ul>
      </div>
      {avoid.length > 0 && (
        <div>
          <p className="mb-2 text-[13px] text-[var(--muted)]">Leave these</p>
          <ul className="flex gap-2" aria-label="Colours to avoid">
            {avoid.map((hex) => (
              <li key={hex} className="d-swatch" style={{ ...box, background: hex }} title={hex} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
