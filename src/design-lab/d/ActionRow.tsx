/**
 * The one action row, pinned at the bottom of the brief column so the next
 * step is never below the fold. What it holds depends on where he is. Before
 * the required lines are answered there is no dead button: a muted line says
 * what is left, and the primary fades in the moment it is ready.
 */
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { STAND_IN_PORTRAIT } from "../shared/catalog";
import { filledCount } from "./model";
import { DESKTOP, useMediaQuery } from "./params";
import { PrimaryButton, QuietButton, TextButton } from "./ui";
import type { BriefController } from "./useBrief";
import type { DnaController } from "./useDna";

interface Props {
  c: BriefController;
  d: DnaController;
}

function Row({ children, stacked = false }: { children: ReactNode; stacked?: boolean }) {
  return <div className={`d-actions ${stacked ? "flex flex-col items-start gap-2" : "flex flex-wrap items-center gap-2"}`}>{children}</div>;
}

interface ReadyProps {
  ready: boolean;
  reduced: boolean;
  answered: number;
  total: number;
  what: string;
  children: ReactNode;
}

const WORD: Record<number, string> = { 4: "four", 5: "five" };

/** The muted count until the required lines are answered, then the actions fade in over 200 ms. */
function ReadyRow({ ready, reduced, answered, total, what, children }: ReadyProps) {
  return (
    <Row>
      <AnimatePresence mode="wait" initial={false}>
        {ready ? (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }} className="flex flex-wrap items-center gap-2">
            {children}
          </motion.div>
        ) : (
          <motion.p key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.12 }} className="d-waiting" aria-live="polite">
            <span>
              Answer the {WORD[total] ?? total} lines to build your {what}. <span className="d-num">{answered} of {total} answered.</span>
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </Row>
  );
}

export function ActionRow({ c, d }: Props) {
  const desktop = useMediaQuery(DESKTOP);
  const dna = c.store.dna;

  if (c.welcome) return null;

  if (c.dnaMode) {
    if (d.phase === "building") return null;
    if (d.result) {
      return (
        <Row>
          <PrimaryButton onClick={d.save}>Save my DNA</PrimaryButton>
          <TextButton onClick={d.redo}>Redo</TextButton>
        </Row>
      );
    }
    return (
      <ReadyRow ready={d.complete} reduced={c.reduced} answered={d.filled} total={4} what="DNA">
        <PrimaryButton onClick={d.resolve}>Build my DNA</PrimaryButton>
        <TextButton onClick={d.exit}>Back to the brief</TextButton>
      </ReadyRow>
    );
  }

  if (c.done) {
    return (
      <Row stacked>
        <PrimaryButton onClick={c.newBrief}>Style another moment</PrimaryButton>
        <QuietButton onClick={() => c.openDrawer("looks")}>Open my looks</QuietButton>
        <TextButton
          onClick={() => {
            if (dna) d.redo();
            c.enterDna();
          }}
        >
          {dna ? "Update my Style DNA" : "Build my Style DNA"}
        </TextButton>
      </Row>
    );
  }

  if (c.phase !== "idle") return null;

  if (c.tryon) {
    if (!c.tryonBuild.done) return null;
    return (
      <Row>
        <PrimaryButton onClick={() => c.openDrawer("buy")}>Buy the pieces</PrimaryButton>
        <TextButton
          onClick={() => {
            c.save(STAND_IN_PORTRAIT);
            c.markDone("saved");
          }}
          disabled={c.savedHero}
        >
          {c.savedHero ? "Saved" : "Save"}
        </TextButton>
        <TextButton onClick={() => c.openDrawer("share")}>Share</TextButton>
        <TextButton onClick={() => c.setTryon(false)} className="lg:ml-auto">
          Back to looks
        </TextButton>
      </Row>
    );
  }

  if (c.resolved && c.hero) {
    return (
      <Row>
        <PrimaryButton onClick={() => c.setTryon(true)}>See it on you</PrimaryButton>
        <TextButton
          onClick={() => {
            c.save();
            c.markDone("saved");
          }}
          disabled={c.savedHero}
        >
          {c.savedHero ? "Saved" : "Save"}
        </TextButton>
        <TextButton onClick={() => c.openDrawer("share")}>Share</TextButton>
        <TextButton onClick={() => (desktop ? c.toggleLine("for") : c.setBriefExpanded(true))} className="lg:ml-auto">
          Back to the brief
        </TextButton>
      </Row>
    );
  }

  return (
    <ReadyRow ready={c.complete} reduced={c.reduced} answered={filledCount(c.values, false)} total={5} what="looks">
      <PrimaryButton onClick={c.resolve}>Build the looks</PrimaryButton>
      {!dna && desktop ? (
        <TextButton onClick={c.enterDna} className="d-wrap text-[13px]">
          Build your Style DNA first, so next time takes two taps
        </TextButton>
      ) : null}
    </ReadyRow>
  );
}
