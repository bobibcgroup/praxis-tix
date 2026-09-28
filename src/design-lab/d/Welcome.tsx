/** First visit: what this is, in two lines and twenty words, then one action. */
import { PrimaryButton, TextButton } from "./ui";

interface Props {
  onStart: () => void;
  onDna: () => void;
}

export function Welcome({ onStart, onDna }: Props) {
  return (
    <div className="flex flex-col pt-4 lg:pt-4">
      <h1 className="d-display max-w-[14ch]">Know what to wear. Every time.</h1>
      <p className="mt-6 max-w-[40ch] text-[16px] leading-6">Tell me where you are going. I build three looks from the catalog, show them on you, and remember what suits you.</p>
      <div className="mt-6 flex flex-col items-start gap-2 lg:mt-10">
        <PrimaryButton onClick={onStart}>Dress me for a moment</PrimaryButton>
        <TextButton onClick={onDna} className="-ml-2">
          Or build my Style DNA first
        </TextButton>
      </div>
    </div>
  );
}

const DONE_LINE = {
  saved: "Saved to your looks",
  reserved: "Pieces reserved for 24 hours",
  dna: "Your DNA is saved",
} as const;

/** The completion state: what just happened, then where next. The actions sit in the pinned row. */
export function Completion({ kind }: { kind: keyof typeof DONE_LINE }) {
  return (
    <div className="mt-6 lg:mt-8" aria-live="polite">
      <p className="text-[13px] text-[var(--muted)]">{DONE_LINE[kind]}</p>
      <h2 className="d-display mt-2">Done. Where next?</h2>
    </div>
  );
}
