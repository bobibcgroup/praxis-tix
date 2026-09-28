/**
 * Concept D: Atelier. The stage of A with the brief of B, on one page that
 * never routes. Brand Forest and Bone, element system Hairline, light and dark.
 */
import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useConceptFonts } from "../shared/fonts";
import { useLabStore } from "../shared/store";
import "./d.css";
import "./d-layout.css";
import { ActionRow } from "./ActionRow";
import { Brief } from "./Brief";
import { BriefHeader } from "./BriefHeader";
import { Canvas } from "./Canvas";
import { DnaBrief } from "./DnaBrief";
import { Drawer } from "./Drawer";
import { BuyList, LooksLibrary, SharePanel, YouPanel } from "./DrawerPanels";
import { LookDetails } from "./LookDetails";
import { TopBar } from "./TopBar";
import { Completion, Welcome } from "./Welcome";
import { useAttachStream } from "./stream";
import type { Captures } from "./model";
import { DESKTOP, useMediaQuery } from "./params";
import { ModeButton } from "./theme";
import { Chevron } from "./ui";
import { useBrief } from "./useBrief";
import { useDna } from "./useDna";
import { useMode } from "./useMode";

const FONTS = "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600&family=Geist:wght@400;500&family=Geist+Mono:wght@400&display=swap";

export default function ConceptD() {
  useConceptFonts("d", FONTS);
  const { mode, setMode } = useMode();
  const store = useLabStore("d");
  const [captures, setCaptures] = useState<Captures>({});
  const c = useBrief(store, captures, setCaptures);
  const d = useDna(store, captures, setCaptures);
  const desktop = useMediaQuery(DESKTOP);
  const videoRef = useRef<HTMLVideoElement>(null);
  useAttachStream(videoRef, c.dnaMode ? d.stream : c.stream);

  const showDetails = c.resolved && c.hero !== null && (desktop || (!c.briefExpanded && c.phase === "idle"));
  /** The title and the orientation line stay while the brief is unresolved, on every width. */
  const orient = !c.welcome && !c.dnaMode && !c.resolved && c.done !== "dna";
  /** On a phone the print band is 38% while the brief is answered, 50% once looks or a portrait need the room. */
  const band = c.resolved || c.phase !== "idle" || c.done !== null || c.dnaMode ? "looks" : "brief";
  const lineOpen = c.dnaMode ? d.openLine !== null : c.openLine !== null;

  let body: ReactNode;
  let bodyKey = "brief";
  if (c.welcome) {
    bodyKey = "welcome";
    body = <Welcome onStart={c.start} onDna={c.enterDna} />;
  } else if (c.dnaMode) {
    bodyKey = "dna";
    body = <DnaBrief d={d} videoRef={videoRef} />;
  } else if (c.done === "dna" && !c.resolved) {
    bodyKey = "done-dna";
    body = <Completion kind="dna" />;
  } else if (desktop) {
    body = (
      <>
        <Brief c={c} videoRef={videoRef} />
        {showDetails && c.hero ? <LookDetails c={c} look={c.hero} /> : null}
        {c.done && c.resolved ? <Completion kind={c.done} /> : null}
      </>
    );
  } else if (showDetails && c.hero) {
    body = (
      <>
        <button type="button" onClick={() => c.setBriefExpanded(true)} aria-expanded={false} className="d-line">
          <span className="label">Brief</span>
          <span className="value">{c.sentence}</span>
          <Chevron />
        </button>
        <LookDetails c={c} look={c.hero} />
        {c.done ? <Completion kind={c.done} /> : null}
      </>
    );
  } else {
    body = <Brief c={c} videoRef={videoRef} compact={c.resolved} onCollapse={c.resolved ? () => c.setBriefExpanded(false) : undefined} />;
  }

  return (
    <div data-lab data-concept="d" data-mode={mode} data-band={band} data-line-open={lineOpen} className="d-stage">
      <TopBar
        savedCount={store.looks.length}
        showNew={c.begun && !c.welcome}
        onNew={c.newBrief}
        onLooks={() => c.openDrawer("looks")}
        onYou={() => c.openDrawer("you")}
        onHome={c.newBrief}
      />
      <div className="d-split d-max">
        <section className="d-brief px-5 lg:px-12 lg:pb-6" aria-label={c.welcome ? "Welcome" : c.dnaMode ? "Your Style DNA" : "The brief"}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={bodyKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={c.reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: c.reduced ? 0 : 0.24, ease: "easeOut" }}
              className="d-column"
            >
              {orient ? <BriefHeader c={c} /> : null}
              <div className="d-body">{body}</div>
            </motion.div>
          </AnimatePresence>
          <ActionRow c={c} d={d} />
        </section>
        <aside className="d-canvas flex min-h-0 flex-col bg-[var(--surface)] px-5 pb-2 pt-2 lg:px-12 lg:pb-20 lg:pt-8" aria-label="Canvas">
          <Canvas c={c} d={d} videoRef={videoRef} />
        </aside>
      </div>

      <Drawer open={c.drawer === "looks"} title="Looks" onClose={c.closeDrawer}>
        <LooksLibrary looks={store.looks} onRemove={store.removeLook} />
      </Drawer>
      <Drawer open={c.drawer === "you"} title="You" onClose={c.closeDrawer}>
        <YouPanel
          dna={store.dna}
          mode={mode}
          onMode={setMode}
          onBuild={() => {
            c.closeDrawer();
            c.enterDna();
          }}
          onRedo={() => {
            d.redo();
            c.enterDna();
          }}
          onRemove={() => {
            store.clearDna();
            c.closeDrawer();
          }}
        />
      </Drawer>
      <Drawer open={c.drawer === "buy" && c.hero !== null} title="Buy the pieces" onClose={c.closeDrawer}>
        {c.hero ? <BuyList look={c.hero} onReserve={() => c.markDone("reserved")} /> : null}
      </Drawer>
      <Drawer open={c.drawer === "share" && c.hero !== null} title="Share" onClose={c.closeDrawer}>
        {c.hero ? <SharePanel look={c.hero} sentence={c.sentence} /> : null}
      </Drawer>

      <ModeButton mode={mode} onMode={setMode} />
    </div>
  );
}
