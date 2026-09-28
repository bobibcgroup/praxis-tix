import { Link, useNavigate } from "react-router-dom";
import { BriefLine } from "./BriefLine";
import { Chips } from "./Chips";
import { DnaHeader } from "./DnaHeader";
import { StageLines } from "./StageLines";
import { WithYouLine } from "./WithYouLine";
import { BASE, LINE_LABEL, LINE_ORDER, optionsFor, valueLabel } from "./model";
import { PrimaryButton, TextButton } from "./ui";
import type { BriefController } from "./useBrief";

/**
 * The brief itself: the DNA header for a returning user, the display line,
 * six lines, the stage lines that tick while a build runs, and one action.
 */
export function Brief({ c }: { c: BriefController }) {
  const navigate = useNavigate();
  const dna = c.store.dna;
  const showStages = c.phase !== "idle" || c.hasBuilt;
  const showResolve = c.complete && !c.resolved && c.phase === "idle";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {dna ? (
        <div className="mt-4">
          <DnaHeader
            dna={dna}
            expanded={c.youOpen}
            onToggle={c.toggleYou}
            onRedo={() => navigate(`${BASE}/dna`)}
            onRemove={() => {
              c.store.clearDna();
              c.toggleYou();
            }}
          />
        </div>
      ) : null}

      <h1 className="mt-6 text-[24px] font-medium leading-tight tracking-[-0.01em] lg:text-[28px]">
        {c.resolved ? "Your brief, resolved." : dna ? "Tell me the moment. Two lines will do." : "Tell me the moment."}
      </h1>

      <div className="mt-4 border-t border-[var(--rule)]">
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
        <WithYouLine c={c} />
      </div>

      {showStages ? (
        <div className="mt-5">
          <StageLines stages={c.stages} index={c.build.index} quiet={c.phase === "idle"} label={c.phase === "rebuilding" ? "Adjusting the looks" : "Resolving the looks"} />
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
        {showResolve ? <PrimaryButton onClick={c.resolve}>Resolve the looks</PrimaryButton> : null}
        {c.resolved && c.phase === "idle" ? (
          <TextButton onClick={c.newBrief} className="text-[13px]">
            New brief
          </TextButton>
        ) : null}
        {!dna && !c.resolved && !showResolve && c.phase === "idle" ? (
          <Link to={`${BASE}/dna`} className="b-link b-wrap text-[13px] transition-colors duration-150">
            Build your Style DNA first, so next time takes two taps
          </Link>
        ) : null}
      </div>
    </div>
  );
}
