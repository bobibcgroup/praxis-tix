/**
 * Style DNA on the same page: four lines with the same mechanics, the DNA
 * stages under them, then the plain-language result in the left column.
 */
import type { RefObject } from "react";
import { FITS, LIFESTYLES, STAND_IN_PORTRAIT, STYLE_PRESETS } from "../shared/catalog";
import { DNA_STAGES } from "../shared/guided";
import { BriefLine } from "./BriefLine";
import { Capture } from "./Capture";
import { Chips } from "./Chips";
import { StageLines } from "./StageLines";
import { DNA_LABEL } from "./useDna";
import type { DnaController } from "./useDna";
import { Caption, Swatches } from "./ui";

interface Props {
  d: DnaController;
  videoRef: RefObject<HTMLVideoElement>;
}

const UNDERTONE = { cool: "Cool undertone", warm: "Warm undertone", neutral: "Neutral undertone" } as const;
const CONTRAST = { high: "strong contrast", medium: "medium contrast", low: "soft contrast" } as const;

export function DnaBrief({ d, videoRef }: Props) {
  const building = d.phase === "building";
  const inspoLabel = d.inspo.map((id) => STYLE_PRESETS.find((p) => p.id === id)?.label).filter(Boolean).join(" and ");

  if (d.result && !building) {
    const { tones } = d.result;
    const facts = [FITS.find((f) => f.id === d.fit)?.label && `${FITS.find((f) => f.id === d.fit)?.label} fit`, LIFESTYLES.find((l) => l.id === d.week)?.label, inspoLabel || null].filter(Boolean);
    return (
      <div className="flex min-h-0 flex-col">
        <h1 className="d-display mb-6 mt-4">Your Style DNA.</h1>
        <p className="max-w-[40ch] text-[16px] leading-6">{tones.line}</p>
        <div className="mt-6">
          <Swatches palette={tones.palette} avoid={tones.avoid} size={32} />
        </div>
        <Caption className="mt-4 hidden lg:block">
          {UNDERTONE[tones.undertone]}, {CONTRAST[tones.contrast]}. {facts.join(". ")}.
        </Caption>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <h1 className="d-display mb-6 mt-4 hidden lg:block">{building ? "Reading you." : "Four lines, and it is yours for good."}</h1>
      <div className="border-t border-[var(--rule)]">
        <BriefLine
          id="dface"
          label={DNA_LABEL.face}
          value={d.face ? (d.face.source === "sample" ? "Sample" : "Your photo") : null}
          open={d.openLine === "face"}
          onToggle={() => d.toggleLine("face")}
        >
          <p className="mb-2 text-[13px] leading-4 text-[var(--muted)]">Skin, hair and eyes set the colours that work near your face. Daylight, no filter.</p>
          <Capture subject="your face" sample={STAND_IN_PORTRAIT} value={d.face} onChange={d.setFace} camera videoRef={videoRef} onStream={d.setStream} />
        </BriefLine>
        <BriefLine id="fit" label={DNA_LABEL.fit} value={FITS.find((f) => f.id === d.fit)?.label ?? null} open={d.openLine === "fit"} onToggle={() => d.toggleLine("fit")}>
          <Chips name="How you like clothes to sit" options={FITS} value={d.fit} onChange={(id) => d.choose("fit", id)} />
        </BriefLine>
        <BriefLine id="week" label={DNA_LABEL.week} value={LIFESTYLES.find((l) => l.id === d.week)?.label ?? null} open={d.openLine === "week"} onToggle={() => d.toggleLine("week")}>
          <Chips name="Where most of your week goes" options={LIFESTYLES} value={d.week} onChange={(id) => d.choose("week", id)} />
        </BriefLine>
        <BriefLine id="inspo" label={DNA_LABEL.inspo} value={inspoLabel || null} open={d.openLine === "inspo"} onToggle={() => d.toggleLine("inspo")}>
          <p className="mb-2 text-[13px] leading-4 text-[var(--muted)]">Up to two. They shape the advice, not the rules.</p>
          <div role="group" aria-label="Inspiration" className="chips">
            {STYLE_PRESETS.map((p) => (
              <button key={p.id} type="button" aria-pressed={d.inspo.includes(p.id)} onClick={() => d.toggleInspo(p.id)} className="d-control">
                {p.label}
              </button>
            ))}
          </div>
        </BriefLine>
      </div>

      {building ? (
        <div className="mt-6">
          <StageLines stages={DNA_STAGES} index={d.build.index} label="Reading your DNA" />
        </div>
      ) : null}

    </div>
  );
}
