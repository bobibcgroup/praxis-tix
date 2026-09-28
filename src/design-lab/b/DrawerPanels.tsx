import { useState } from "react";
import type { Look, Piece } from "../shared/catalog";
import type { SavedLook } from "../shared/store";
import { formatPrice } from "./model";
import { PrimaryButton, SecondaryButton, TextButton } from "./ui";

interface LibraryProps {
  looks: SavedLook[];
  onRemove: (id: string) => void;
}

function savedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** A quiet library. Rows, not cards; remove is the only control. */
export function LooksLibrary({ looks, onRemove }: LibraryProps) {
  if (looks.length === 0) {
    return <p className="text-[15px] leading-snug text-[var(--muted)]">Nothing saved yet. Save a look and it will wait here.</p>;
  }
  return (
    <ul className="border-t border-[var(--rule)]">
      {looks.map((entry) => (
        <li key={entry.id} className="flex items-start gap-4 border-b border-[var(--rule)] py-4">
          <img src={entry.tryOnImage ?? entry.look.image} alt={`${entry.look.title} for ${entry.occasionLabel}`} className="b-frame h-[80px] w-[64px] shrink-0 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium leading-5">{entry.look.title}</p>
            <p className="mt-0.5 text-[13px] leading-4 text-[var(--muted)]">
              {entry.occasionLabel}
              {entry.tryOnImage ? ", rendered on you" : ""}
            </p>
            <p className="b-mono mt-2 text-[13px] leading-none">
              {formatPrice(entry.look.total)}
              <span className="ml-3 text-[var(--muted)]">{savedDate(entry.savedAt)}</span>
            </p>
          </div>
          <TextButton onClick={() => onRemove(entry.id)} className="shrink-0 text-[13px]">
            Remove
          </TextButton>
        </li>
      ))}
    </ul>
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

/** The vendor list. "Buy" opens a confirmation inside the prototype, never a store. */
export function BuyList({ look }: { look: Look }) {
  const [sent, setSent] = useState<readonly string[]>([]);
  const groups = groupByVendor(look.pieces);
  const owned = look.pieces.filter((p) => p.owned);

  return (
    <div>
      <p className="text-[15px] leading-snug text-[var(--muted)]">
        {look.title}. Each vendor checks out separately. {formatPrice(look.total)} in all.
      </p>
      {groups.map((group) => {
        const subtotal = group.pieces.reduce((sum, p) => sum + p.price, 0);
        const done = sent.includes(group.vendor);
        return (
          <section key={group.vendor} aria-label={group.vendor} className="mt-6 border-t border-[var(--rule)] pt-4">
            <h3 className="text-[15px] font-medium leading-5">{group.vendor}</h3>
            <ul className="mt-2">
              {group.pieces.map((piece) => (
                <li key={piece.id} className="flex h-8 items-center gap-3 text-[15px]">
                  <span className="min-w-0 flex-1 truncate">{piece.name}</span>
                  <span className="b-mono shrink-0">{formatPrice(piece.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between gap-4">
              {done ? (
                <p role="status" className="text-[13px] leading-snug text-[var(--muted)]">
                  Sent to {group.vendor}. In the real product their checkout opens here. Nothing was charged.
                </p>
              ) : (
                <SecondaryButton onClick={() => setSent((prev) => [...prev, group.vendor])}>Buy from {group.vendor}</SecondaryButton>
              )}
              {done ? null : <span className="b-mono shrink-0 text-[13px] text-[var(--muted)]">{formatPrice(subtotal)}</span>}
            </div>
          </section>
        );
      })}
      {owned.length ? (
        <section aria-label="Already yours" className="mt-6 border-t border-[var(--rule)] pt-4">
          <h3 className="text-[15px] font-medium leading-5">Already yours</h3>
          <ul className="mt-2">
            {owned.map((piece) => (
              <li key={piece.id} className="flex h-8 items-center text-[15px] text-[var(--muted)]">
                {piece.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

interface ShareProps {
  look: Look;
  sentence: string;
  url: string;
}

/** Share uses the system sheet when there is one, else copies the link and says so quietly. */
export function SharePanel({ look, sentence, url }: ShareProps) {
  const [status, setStatus] = useState<string | null>(null);

  const share = async () => {
    const payload = { title: `${look.title} for ${sentence}`, text: `${look.title}. ${look.why}`, url };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(payload);
        setStatus("Shared.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("Link copied.");
    } catch {
      setStatus("Copy the link above to share it.");
    }
  };

  return (
    <div>
      <div className="flex items-start gap-4">
        <img src={look.image} alt={look.title} className="b-frame h-[100px] w-[80px] shrink-0 object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium leading-5">{look.title}</p>
          <p className="b-mono mt-1 text-[13px] leading-snug text-[var(--muted)]">{sentence}</p>
          <p className="mt-2 text-[13px] leading-snug text-[var(--muted)]">{look.why}</p>
        </div>
      </div>
      <p className="b-mono mt-6 break-all border-t border-[var(--rule)] pt-4 text-[13px] leading-snug text-[var(--muted)]">{url}</p>
      <div className="mt-4 flex items-center gap-4">
        <PrimaryButton onClick={share}>Share this look</PrimaryButton>
        {status ? (
          <span role="status" className="text-[13px] text-[var(--muted)]">
            {status}
          </span>
        ) : null}
      </div>
    </div>
  );
}
