import { useState } from "react";
import type { Look } from "../shared/catalog";
import { SLOT_LABELS, formatPrice } from "./content";
import { Primary, Quiet, Secondary, Status } from "./controls";

interface LookDetailsProps {
  look: Look;
  occasionLabel: string;
  saved: boolean;
  onSave: () => void;
  /** Present for a saved look; replaces Save with Remove. */
  onRemove?: () => void;
  onClose: () => void;
}

function vendorSummary(look: Look): string {
  const vendors = Array.from(new Set(look.pieces.filter((p) => !p.owned).map((p) => p.vendor)));
  if (vendors.length === 0) return "everything from your wardrobe";
  if (vendors.length === 1) return vendors[0];
  return `${vendors.slice(0, -1).join(", ")} and ${vendors[vendors.length - 1]}`;
}

/** The sheet's contents: pieces, vendors, prices, total, and the three actions. */
export default function LookDetails({ look, occasionLabel, saved, onSave, onRemove, onClose }: LookDetailsProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [bought, setBought] = useState(false);
  const bought_pieces = look.pieces.filter((p) => !p.owned);

  const share = async () => {
    const url = window.location.href;
    const data = { title: `${look.title} for ${occasionLabel.toLowerCase()}`, text: look.why, url };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    } catch {
      setStatus("Sharing is not available here");
    }
    window.setTimeout(() => setStatus(null), 2200);
  };

  if (bought) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[18px] font-medium">Checkout ready</h2>
          <Quiet onClick={onClose}>Close</Quiet>
        </div>
        <p className="text-[16px] text-[var(--text)]">
          {bought_pieces.length} {bought_pieces.length === 1 ? "piece" : "pieces"} from {vendorSummary(look)}, {formatPrice(look.total)} in total. Each vendor ships separately.
        </p>
        <div className="mt-auto flex items-center gap-3 pt-2">
          <Primary onClick={onClose}>Done</Primary>
          <Quiet onClick={() => setBought(false)}>Back to the pieces</Quiet>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-medium leading-tight">{look.title}</h2>
          <p className="text-[14px] text-[var(--muted)]">For {occasionLabel.toLowerCase()}</p>
        </div>
        <Quiet onClick={onClose}>Close</Quiet>
      </div>

      <ul className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {look.pieces.map((piece) => (
          <li key={piece.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 border-t border-[var(--edge)] py-2 first:border-t-0">
            <span className="text-[14px] text-[var(--muted)]">{SLOT_LABELS[piece.slot]}</span>
            <span className="min-w-0">
              <span className="block truncate text-[16px] leading-tight">{piece.name}</span>
              <span className="block text-[14px] leading-tight text-[var(--muted)]">{piece.vendor}</span>
            </span>
            <span className="text-[16px] tabular-nums">{piece.owned ? "Yours" : formatPrice(piece.price)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between border-t border-[var(--edge-strong)] pt-2">
        <span className="text-[14px] text-[var(--muted)]">Total</span>
        <span className="text-[18px] font-medium tabular-nums">{formatPrice(look.total)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {onRemove ? (
          <Secondary onClick={onRemove}>Remove</Secondary>
        ) : (
          <Secondary onClick={onSave} aria-pressed={saved}>
            {saved ? "Saved" : "Save"}
          </Secondary>
        )}
        <Secondary onClick={share}>Share</Secondary>
        <Primary onClick={() => setBought(true)} className="ml-auto">
          Buy the pieces
        </Primary>
      </div>
      <Status text={status} />
    </div>
  );
}
