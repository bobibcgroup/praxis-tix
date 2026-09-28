/**
 * The brief: six lines visible from the first second, the open line's chips
 * inline, the stages ticking under it while a build runs. The title and the
 * orientation line sit above this in BriefHeader, pinned outside the scroll.
 */
import type { RefObject } from "react";
import { BriefLine } from "./BriefLine";
import { Chips } from "./Chips";
import { StageLines } from "./StageLines";
import { WithYouLine } from "./WithYouLine";
import { LINE_LABEL, LINE_ORDER, dnaSummary, optionsFor, valueLabel } from "./model";
import { Chevron } from "./ui";
import type { BriefController } from "./useBrief";

interface Props {
  c: BriefController;
  videoRef: RefObject<HTMLVideoElement>;
  /** After results the lines sit tighter; on mobile the whole brief hides behind one collapsed line. */
  compact?: boolean;
  onCollapse?: () => void;
}

export function Brief({ c, videoRef, compact = false, onCollapse }: Props) {
  const dna = c.store.dna;
  const building = c.phase !== "idle";

  return (
    <div className="flex min-h-0 flex-col">
      {dna && !compact ? (
        <button type="button" onClick={() => c.openDrawer("you")} className="d-line">
          <span className="label">Your DNA</span>
          <span className="value">{dnaSummary(dna)}</span>
          <Chevron />
        </button>
      ) : null}

      {compact && onCollapse ? (
        <button type="button" onClick={onCollapse} className="d-line" aria-expanded>
          <span className="label">Brief</span>
          <span className="value">{c.sentence}</span>
          <Chevron />
        </button>
      ) : null}

      <div className={!compact && !c.resolved && !dna ? "border-t border-[var(--rule)]" : ""}>
        {LINE_ORDER.map((line) => (
          <BriefLine
            key={line}
            id={line}
            label={LINE_LABEL[line]}
            value={valueLabel(line, c.values)}
            note={c.notes[line]}
            open={c.openLine === line}
            onToggle={() => c.toggleLine(line)}
          >
            <Chips name={LINE_LABEL[line]} options={optionsFor(line, c.values)} value={c.values[line]} onChange={(id) => c.choose(line, id)} />
          </BriefLine>
        ))}
        <WithYouLine c={c} videoRef={videoRef} />
      </div>

      {building ? (
        <div className="mt-6">
          <StageLines stages={c.stages} index={c.build.index} label={c.phase === "rebuilding" ? "Adjusting the looks" : "Building the looks"} />
        </div>
      ) : null}
    </div>
  );
}
