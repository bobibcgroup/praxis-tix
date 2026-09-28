/**
 * The orientation, pinned above the lines so it never scrolls away: the
 * question the page answers and one line on what happens next. Shown while
 * the brief is unresolved; the title is desktop-only, the line is on every width.
 */
import type { BriefController } from "./useBrief";

export const ORIENTATION_LINE = "Answer five lines. I build three looks from the catalog and show them on you.";

export function BriefHeader({ c }: { c: BriefController }) {
  const building = c.phase !== "idle";
  return (
    <div className="d-brief-head">
      <h1 className="d-display hidden lg:block">{building ? `Three looks for ${c.occasion.toLowerCase()}, forming.` : "Where are you going?"}</h1>
      {building ? null : <p className="d-orient">{ORIENTATION_LINE}</p>}
    </div>
  );
}
