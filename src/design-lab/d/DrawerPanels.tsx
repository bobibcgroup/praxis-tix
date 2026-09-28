/** What the four drawers hold: the Looks library, You (the DNA and the appearance), Buy, Share. */
import { useState } from "react";
import type { Look, Piece } from "../shared/catalog";
import type { SavedDna, SavedLook } from "../shared/store";
import { SLOT_LABEL, dnaSummary, faceCropStyle, money } from "./model";
import { shareLook, type ShareOutcome } from "./share";
import { ModeRadio } from "./theme";
import { PrimaryButton, QuietButton, Swatches, TextButton } from "./ui";
import type { ModeId } from "./useMode";

function savedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

interface LibraryProps {
  looks: SavedLook[];
  onRemove: (id: string) => void;
}

/** A quiet library. Rows that open to the print and the pieces; Remove is the only other control. */
export function LooksLibrary({ looks, onRemove }: LibraryProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (looks.length === 0) {
    return <p className="text-[16px] leading-6 text-[var(--muted)] lg:text-[15px]">Nothing saved yet. Save a look and it will wait here.</p>;
  }
  return (
    <ul className="border-t border-[var(--rule)]">
      {looks.map((entry) => {
        const open = openId === entry.id;
        return (
          <li key={entry.id} className="border-b border-[var(--rule)] py-4">
            <div className="flex items-start gap-4">
              <button type="button" onClick={() => setOpenId(open ? null : entry.id)} aria-expanded={open} className="flex min-h-[44px] min-w-0 flex-1 items-start gap-4 text-left">
                <img src={entry.tryOnImage ?? entry.look.image} alt="" className="block h-[85px] w-[64px] shrink-0 object-cover object-top" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-5">{entry.look.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-4 text-[var(--muted)]">
                    {entry.occasionLabel}
                    {entry.tryOnImage ? ", rendered on you" : ""}
                  </span>
                  <span className="d-mono mt-2 block text-[13px] leading-none">
                    {money(entry.look.total)}
                    <span className="ml-3 text-[var(--muted)]">{savedDate(entry.savedAt)}</span>
                  </span>
                </span>
              </button>
              <TextButton onClick={() => onRemove(entry.id)} className="shrink-0 text-[13px]">
                Remove
              </TextButton>
            </div>
            {open ? (
              <div className="mt-4 flex flex-col gap-4">
                <img src={entry.tryOnImage ?? entry.look.image} alt={`${entry.look.title} for ${entry.occasionLabel.toLowerCase()}`} className="block aspect-[3/4] w-[60%] object-cover object-top" />
                <PieceList look={entry.look} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function PieceList({ look }: { look: Look }) {
  return (
    <div role="list" aria-label="Pieces">
      {look.pieces.map((p) => (
        <div key={p.id} className="d-row" role="listitem">
          <span>
            {p.name}
            <span className="vendor">{p.vendor}</span>
          </span>
          <span className="d-mono">{money(p.price)}</span>
        </div>
      ))}
    </div>
  );
}

interface YouProps {
  dna: SavedDna | null;
  mode: ModeId;
  onMode: (m: ModeId) => void;
  onBuild: () => void;
  onRedo: () => void;
  onRemove: () => void;
}

export function YouPanel({ dna, mode, onMode, onBuild, onRedo, onRemove }: YouProps) {
  return (
    <div className="flex flex-col gap-10">
      {dna ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            {dna.portrait ? (
              <span className="block h-[85px] w-[64px] shrink-0 overflow-hidden">
                <img src={dna.portrait} alt="Your portrait" className="block h-full w-full object-cover object-top" style={faceCropStyle(dna.portrait)} />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium leading-5">{dnaSummary(dna)}</p>
              <p className="mt-2 text-[16px] leading-6 text-[var(--muted)] lg:text-[15px]">{dna.tones.line}</p>
            </div>
          </div>
          <Swatches palette={dna.tones.palette} avoid={dna.tones.avoid} />
          <div className="flex gap-2">
            <QuietButton onClick={onRedo}>Redo</QuietButton>
            <TextButton onClick={onRemove}>Remove</TextButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="max-w-[36ch] text-[16px] leading-6 text-[var(--muted)] lg:text-[15px]">Four lines once (face, fit, week, inspiration) and every brief after that takes two taps.</p>
          <PrimaryButton onClick={onBuild} className="self-start">
            Build my Style DNA
          </PrimaryButton>
        </div>
      )}
      <div className="flex flex-col gap-4 border-t border-[var(--rule)] pt-6">
        <p className="text-[13px] text-[var(--muted)]">Appearance</p>
        <ModeRadio mode={mode} onMode={onMode} />
      </div>
    </div>
  );
}

function groupByVendor(pieces: Piece[]): Array<{ vendor: string; pieces: Piece[] }> {
  return pieces
    .filter((p) => !p.owned)
    .reduce<Array<{ vendor: string; pieces: Piece[] }>>((groups, piece) => {
      const group = groups.find((g) => g.vendor === piece.vendor);
      if (group) return groups.map((g) => (g.vendor === piece.vendor ? { ...g, pieces: [...g.pieces, piece] } : g));
      return [...groups, { vendor: piece.vendor, pieces: [piece] }];
    }, []);
}

/** The pieces by vendor with a total; "Reserve" opens a confirmation inside the prototype, never a store. */
export function BuyList({ look, onReserve }: { look: Look; onReserve: () => void }) {
  const groups = groupByVendor(look.pieces);
  const owned = look.pieces.filter((p) => p.owned);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.vendor} aria-label={g.vendor}>
          <h3 className="text-[13px] font-medium text-[var(--muted)]">{g.vendor}</h3>
          <div className="mt-2" role="list">
            {g.pieces.map((p) => (
              <div key={p.id} className="d-row" role="listitem">
                <span>
                  {p.name}
                  <span className="vendor">{SLOT_LABEL[p.slot]}</span>
                </span>
                <span className="d-mono">{money(p.price)}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
      {owned.length > 0 ? (
        <section aria-label="Already yours">
          <h3 className="text-[13px] font-medium text-[var(--muted)]">Already yours</h3>
          <div className="mt-2" role="list">
            {owned.map((p) => (
              <div key={p.id} className="d-row" role="listitem">
                <span>
                  {p.name}
                  <span className="vendor">{SLOT_LABEL[p.slot]}</span>
                </span>
                <span className="d-mono text-[var(--muted)]">Owned</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <div>
        <div className="d-total">
          <span>Total</span>
          <span className="d-mono">{money(look.total)}</span>
        </div>
        <p className="mt-4 text-[13px] leading-5 text-[var(--muted)]">Each vendor holds the pieces in your size for 24 hours. Nothing is charged here; you pay at the vendor's own checkout.</p>
        <PrimaryButton className="mt-4 w-full" onClick={onReserve}>
          Reserve with {groups.length === 1 ? "the vendor" : `${groups.length} vendors`}
        </PrimaryButton>
      </div>
    </div>
  );
}

interface ShareProps {
  look: Look;
  sentence: string;
}

export function SharePanel({ look, sentence }: ShareProps) {
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const url = typeof window === "undefined" ? "" : window.location.href;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const label = outcome === "copied" ? "Link copied" : outcome === "shared" ? "Shared" : outcome === "failed" ? "Could not share" : canShare ? "Share" : "Copy the link";

  return (
    <div className="flex flex-col gap-4">
      <img src={look.image} alt={look.title} className="block h-[128px] w-[96px] object-cover object-top" />
      <p className="text-[16px] leading-6 lg:text-[15px]">
        {look.title}, for {sentence.toLowerCase() || "a moment"}. {money(look.total)} in all.
      </p>
      <p className="d-mono break-all text-[13px] leading-5 text-[var(--muted)]">{url}</p>
      <PrimaryButton
        onClick={async () => {
          setOutcome(await shareLook(`${look.title}, from Praxis`, url));
        }}
        className="self-start"
        aria-live="polite"
      >
        {label}
      </PrimaryButton>
    </div>
  );
}
