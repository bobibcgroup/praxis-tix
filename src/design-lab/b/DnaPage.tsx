import { Link } from "react-router-dom";
import { FITS, LIFESTYLES, STAND_IN_PORTRAIT, STYLE_PRESETS } from "../shared/catalog";
import { DNA_STAGES } from "../shared/guided";
import { BriefLine } from "./BriefLine";
import { Capture } from "./Capture";
import { Chips } from "./Chips";
import { DnaResult } from "./DnaResult";
import { Drawer } from "./Drawer";
import { LooksLibrary } from "./DrawerPanels";
import { MobileSheet } from "./MobileSheet";
import { StageLines } from "./StageLines";
import { BASE, SOURCE_LABEL, type Captures, type LabStore } from "./model";
import { DESKTOP, useMediaQuery } from "./params";
import { PrimaryButton, TextButton } from "./ui";
import { useDna, type DnaController } from "./useDna";

interface Props {
  store: LabStore;
  captures: Captures;
  setCaptures: (fn: (prev: Captures) => Captures) => void;
}

/** Up to two presets, each a small image with its name. */
function Presets({ c }: { c: DnaController }) {
  return (
    <div role="group" aria-label="Inspiration, up to two" className="flex flex-wrap gap-2">
      {STYLE_PRESETS.map((preset) => {
        const checked = c.inspo.includes(preset.id);
        return (
          <button
            key={preset.id}
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => c.toggleInspo(preset.id)}
            className="b-chip !flex-row items-center gap-3 !py-1.5 !pl-1.5 transition-colors duration-150"
          >
            <img src={preset.images[0]} alt="" className="h-10 w-8 rounded-[4px] object-cover" />
            <span className="text-[15px] leading-5">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function DnaBrief({ c }: { c: DnaController }) {
  const inspoLabel = c.inspo.map((id) => STYLE_PRESETS.find((p) => p.id === id)?.label).filter(Boolean).join(", ");
  const showResolve = c.complete && !c.resolved && c.phase === "idle";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mt-6 text-[24px] font-medium leading-tight tracking-[-0.01em] lg:text-[28px]">
        {c.resolved ? "Your DNA, saved." : "Tell me about you."}
      </h1>
      <div className="mt-4 border-t border-[var(--rule)]">
        <BriefLine id="face" label="Face" value={c.face ? SOURCE_LABEL[c.face.source] : null} open={c.openLine === "face"} onToggle={() => c.toggleLine("face")}>
          <Capture subject="your face" sample={STAND_IN_PORTRAIT} value={c.face} onChange={c.setFace} />
        </BriefLine>
        <BriefLine id="fit" label="Fit" value={FITS.find((f) => f.id === c.fit)?.label ?? null} open={c.openLine === "fit"} onToggle={() => c.toggleLine("fit")}>
          <Chips name="Fit" options={FITS} value={c.fit} onChange={(id) => c.choose("fit", id)} />
        </BriefLine>
        <BriefLine id="week" label="Week" value={LIFESTYLES.find((l) => l.id === c.week)?.label ?? null} open={c.openLine === "week"} onToggle={() => c.toggleLine("week")}>
          <Chips name="Your week" options={LIFESTYLES} value={c.week} onChange={(id) => c.choose("week", id)} />
        </BriefLine>
        <BriefLine id="inspo" label="Inspiration" value={inspoLabel || null} open={c.openLine === "inspo"} onToggle={() => c.toggleLine("inspo")}>
          <Presets c={c} />
        </BriefLine>
      </div>
      {c.phase !== "idle" || c.hasBuilt ? (
        <div className="mt-5">
          <StageLines stages={DNA_STAGES} index={c.build.index} quiet={c.phase === "idle"} label="Building your DNA" />
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
        {showResolve ? <PrimaryButton onClick={c.resolve}>Resolve my DNA</PrimaryButton> : null}
        {c.resolved && c.phase === "idle" ? (
          <TextButton onClick={c.redo} className="text-[13px]">
            Redo
          </TextButton>
        ) : null}
        {!showResolve && !c.resolved && c.phase === "idle" ? (
          <Link to={BASE} className="b-link text-[13px] transition-colors duration-150">
            Skip this and style a moment
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** Style DNA on the same page shape: four lines left, the read-out right. */
export default function DnaPage({ store, captures, setCaptures }: Props) {
  const desktop = useMediaQuery(DESKTOP);
  const c = useDna(store, captures, setCaptures);
  const mobileResolved = !desktop && c.resolved;

  return (
    <main className="lg:grid lg:h-[100dvh] lg:grid-cols-[42fr_58fr] lg:overflow-hidden">
      <section
        aria-label="Your DNA brief"
        className={`b-scroll flex min-h-[100dvh] flex-col px-[var(--gutter)] py-5 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:py-6 ${
          mobileResolved && !c.sheetOpen ? "pb-24" : ""
        }`}
      >
        <header className="flex h-11 shrink-0 items-center justify-between lg:h-10">
          <Link to={BASE} className="text-[13px] font-medium leading-none tracking-[0.02em]">
            Praxis
          </Link>
          <nav aria-label="Looks and the brief" className="-mr-2 flex items-center gap-2">
            <button type="button" onClick={c.openDrawer} className="flex h-11 items-center px-2 text-[13px] leading-none transition-colors duration-150 hover:text-[var(--accent)] lg:h-8">
              Looks
              {store.looks.length > 0 ? <span className="b-mono ml-1.5 text-[12px] text-[var(--muted)]">{store.looks.length}</span> : null}
            </button>
            <Link to={BASE} className="flex h-11 items-center px-2 text-[13px] leading-none transition-colors duration-150 hover:text-[var(--accent)] lg:h-8">
              Brief
            </Link>
          </nav>
        </header>
        <DnaBrief c={c} />
      </section>

      <section aria-label="Your DNA" className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:border-l lg:border-[var(--rule)] lg:px-[var(--gutter)] lg:py-6">
        <div className="flex h-10 shrink-0 items-center justify-end">
          <span className="b-mono text-[13px] leading-none text-[var(--muted)]">{c.resolved ? "Style DNA" : ""}</span>
        </div>
        <div className="b-scroll mt-6 min-h-0 flex-1 overflow-y-auto">{desktop ? <DnaResult c={c} compact={false} /> : null}</div>
      </section>

      {desktop ? null : (
        <MobileSheet open={c.resolved && c.sheetOpen} label="Your DNA" onClose={() => c.setSheetOpen(false)}>
          <DnaResult c={c} compact />
        </MobileSheet>
      )}

      {mobileResolved && !c.sheetOpen ? (
        <div className="fixed inset-x-[var(--gutter)] bottom-5 z-20">
          <PrimaryButton onClick={() => c.setSheetOpen(true)} className="w-full">
            Show my DNA
          </PrimaryButton>
        </div>
      ) : null}

      <Drawer open={c.drawerOpen} title="Looks" onClose={c.closeDrawer}>
        <LooksLibrary looks={store.looks} onRemove={store.removeLook} />
      </Drawer>
    </main>
  );
}
