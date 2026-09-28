import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { BASE } from "./model";
import { PrimaryButton, Swatches, TextButton } from "./ui";
import type { DnaController } from "./useDna";

interface Props {
  c: DnaController;
  compact: boolean;
}

/** The DNA in plain words: undertone, contrast, palette, one line of advice. */
export function DnaResult({ c, compact }: Props) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const frame = compact ? "h-[220px] w-[176px]" : "h-[min(52dvh,460px)] w-auto aspect-[4/5]";
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.28, delay: reduced ? 0 : delay, ease: "easeOut" as const },
  });

  if (c.phase === "building") {
    return (
      <div className="flex" aria-live="polite" aria-label="Reading your tones">
        <motion.figure initial={{ opacity: 1 }} animate={{ opacity: 0.6 }} transition={{ duration: reduced ? 0 : 0.2 }} className="shrink-0">
          <div className={`b-frame ${frame}`}>{c.face ? <img src={c.face.image} alt="Your portrait" className="h-full w-full object-cover" /> : null}</div>
          <figcaption className="mt-2 text-[12px] leading-none text-[var(--muted)]">Reading</figcaption>
        </motion.figure>
      </div>
    );
  }

  if (!c.result) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center">
        <p className="text-[15px] text-[var(--muted)]">Your DNA will appear here.</p>
      </div>
    );
  }

  const { tones, portrait } = c.result;
  const rows: Array<[string, string]> = [
    ["Undertone", tones.undertone],
    ["Contrast", tones.contrast],
  ];

  return (
    <div className={compact ? "flex flex-col gap-5" : "flex gap-8"}>
      <motion.figure {...rise(0)} className="shrink-0">
        <div className={`b-frame ${frame}`}>{portrait ? <img src={portrait} alt="Your portrait" className="h-full w-full object-cover" /> : null}</div>
        <figcaption className="mt-2 text-[12px] leading-none text-[var(--muted)]">Read from this</figcaption>
      </motion.figure>
      <motion.div {...rise(0.12)} className="flex min-w-0 flex-1 flex-col">
        <h2 className="text-[20px] font-medium leading-tight">What suits you</h2>
        <dl className="mt-3 border-t border-[var(--rule)]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex h-10 items-center gap-4">
              <dt className="w-[96px] shrink-0 text-[13px] font-medium">{label}</dt>
              <dd className="b-mono text-[17px] leading-none">{value}</dd>
            </div>
          ))}
          <div className="flex h-12 items-center gap-4">
            <dt className="w-[96px] shrink-0 text-[13px] font-medium">Palette</dt>
            <dd>
              <Swatches palette={tones.palette} size={32} />
            </dd>
          </div>
          <div className="flex h-12 items-center gap-4">
            <dt className="w-[96px] shrink-0 text-[13px] font-medium">Leave</dt>
            <dd>
              <Swatches palette={tones.avoid} size={32} label="Colours to leave" />
            </dd>
          </div>
        </dl>
        <p className="mt-4 border-t border-[var(--rule)] pt-4 text-[20px] leading-snug">{tones.line}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <PrimaryButton onClick={() => navigate(BASE)}>Back to the brief</PrimaryButton>
          <TextButton onClick={c.redo}>Redo</TextButton>
        </div>
      </motion.div>
    </div>
  );
}
