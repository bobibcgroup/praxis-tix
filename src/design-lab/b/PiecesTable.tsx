import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { Piece } from "../shared/catalog";
import { formatPrice } from "./model";
import { Chevron } from "./ui";

interface Props {
  pieces: Piece[];
  total: number;
  /** On mobile the list collapses to the total until tapped. */
  compact?: boolean;
}

function Rows({ pieces }: { pieces: Piece[] }) {
  return (
    <ul className="border-t border-[var(--rule)]">
      {pieces.map((piece) => (
        <li key={piece.id} className="flex h-9 items-center gap-3 text-[15px]">
          <span className="min-w-0 flex-1 truncate">{piece.name}</span>
          <span className="w-[118px] shrink-0 truncate text-[13px] text-[var(--muted)]">{piece.vendor}</span>
          <span className="b-mono w-[60px] shrink-0 text-right text-[15px]">{piece.owned ? "Yours" : formatPrice(piece.price)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Piece, vendor, price in a tabular block, then the total. */
export function PiecesTable({ pieces, total, compact = false }: Props) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  if (!compact) {
    return (
      <div className="mt-4">
        <Rows pieces={pieces} />
        <div className="flex h-10 items-center border-t border-[var(--rule)] text-[15px] font-medium">
          <span className="flex-1">Total</span>
          <span className="b-mono">{formatPrice(total)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-b border-[var(--rule)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="pieces-list"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center gap-3 border-t border-[var(--rule)] text-[15px]"
      >
        <span className="flex-1 font-medium">{pieces.length} pieces</span>
        <span className="b-mono">{formatPrice(total)}</span>
        <Chevron open={open} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="list"
            id="pieces-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pb-2">
              <Rows pieces={pieces} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
