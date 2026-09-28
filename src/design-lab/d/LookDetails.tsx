/**
 * The result in the left column: title, the one-line why, pieces on the
 * baseline grid with tabular prices on one right edge, the total under a
 * rule, then the actions. On mobile the pieces collapse to one line that
 * opens the Buy drawer.
 */
import { TRYON_STAGES } from "../shared/guided";
import type { Look } from "../shared/catalog";
import { ROLE_LABEL, money } from "./model";
import { StageLines } from "./StageLines";
import type { BriefController } from "./useBrief";

interface Props {
  c: BriefController;
  look: Look;
}

export function LookDetails({ c, look }: Props) {
  const tryon = c.tryon;
  const rendering = tryon && c.tryonBuild.done;
  const done = c.done !== null;
  const vendors = new Set(look.pieces.filter((p) => !p.owned).map((p) => p.vendor)).size;

  if (tryon && !c.tryonBuild.done) {
    return (
      <div className="mt-6 flex min-h-0 flex-col lg:mt-8">
        <h1 className="d-display">Putting it on you.</h1>
        <div className="mt-6">
          <StageLines stages={TRYON_STAGES} index={c.tryonBuild.index} label="Rendering the look on you" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex min-h-0 flex-col lg:mt-8">
      <p className="mb-2 text-[13px] text-[var(--muted)]">{rendering ? "Rendered on you" : `${ROLE_LABEL[look.role]} for ${c.occasion.toLowerCase()}`}</p>
      <h1 className="d-display">{look.title}</h1>
      <p className="mt-4 max-w-[40ch] text-[16px] leading-6">{look.why}</p>

      <div className={`mt-4 ${done ? "hidden" : "hidden lg:block"}`} role="list" aria-label="Pieces">
        {look.pieces.map((p) => (
          <div key={p.id} className="d-row" role="listitem">
            <span>
              {p.name}
              <span className="vendor">{p.vendor}</span>
            </span>
            <span className={`d-mono ${p.owned ? "text-[var(--muted)]" : ""}`}>{money(p.price)}</span>
          </div>
        ))}
        <div className="d-total">
          <span>Total</span>
          <span className="d-mono">{money(look.total)}</span>
        </div>
      </div>

      <button type="button" onClick={() => c.openDrawer("buy")} className={`mt-4 grid h-11 grid-cols-[1fr_auto] items-center border-t border-[var(--rule)] pt-2 text-left font-medium ${done ? "hidden" : "lg:hidden"}`}>
        <span>
          {look.pieces.length} pieces from {vendors} {vendors === 1 ? "vendor" : "vendors"}
        </span>
        <span className="d-mono">{money(look.total)}</span>
      </button>

    </div>
  );
}
