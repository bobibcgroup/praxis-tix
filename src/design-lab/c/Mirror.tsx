import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useLocation } from "react-router-dom";
import { getLooks, orderByVibe, withOwnedItem, type OccasionId, type SpendId, type TimeId, type VibeId } from "../shared/catalog";
import { MOMENT_STAGES } from "../shared/guided";
import BuildRunner from "./BuildRunner";
import { readImageFile } from "./capture";
import {
  MOMENT_QUESTIONS,
  MOMENT_STEPS,
  SAMPLE_PIECE,
  UPLOAD_ERROR,
  WASHES,
  lookLabel,
  momentCaption,
  momentOptions,
  momentValue,
  occasionLabel,
  quickMoment,
  reached,
  type MomentStep,
} from "./content";
import { useGo, useLab, useLater, useRelativePath } from "./context";
import { Dots, Primary, Quiet, Status } from "./controls";
import Deck from "./Deck";
import Dial from "./Dial";
import Frame from "./Frame";
import type { Slot } from "./journey";
import LookDetails from "./LookDetails";
import Sheet from "./Sheet";
import Signature from "./Signature";
import Stage from "./Stage";
import { useStepIn } from "./StepIn";

type Scene = "entry" | "step" | "build" | "result";
const ADVANCE_MS = 480;
const AFTER_STEPS: Partial<Record<MomentStep, MomentStep>> = { occasion: "venue", venue: "time", time: "vibe", vibe: "spend", spend: "piece" };

function isStep(value: string | undefined): value is MomentStep {
  return (MOMENT_STEPS as readonly string[]).includes(value ?? "");
}

/** One component for the whole moment: entry, the questions, the build, the result. The frame never leaves. */
export default function Mirror() {
  const { store, journey, portraitSrc, hasPortrait, reduced } = useLab();
  const go = useGo();
  const later = useLater();
  const location = useLocation();
  const rel = useRelativePath();
  const [head, second, third] = rel.split("/");
  const scene: Scene = head === "" ? "entry" : head === "step" ? "step" : head === "build" ? "build" : head === "result" ? "result" : "entry";
  const step = scene === "step" && isStep(second) ? second : null;
  const moment = journey.journey.moment;
  const returning = store.dna !== null;
  const [focused, setFocused] = useState<string | null>(null);
  const [build, setBuild] = useState<{ progress: number; label: string | null }>({ progress: 0, label: null });
  const [pieceError, setPieceError] = useState<string | null>(null);
  const pieceFile = useRef<HTMLInputElement>(null);

  const stepIn = useStepIn({
    hasPortrait,
    question: MOMENT_QUESTIONS.face,
    onDone: (portrait) => {
      if (portrait) journey.setPortrait(portrait);
      go("step/occasion");
    },
  });

  // Route guards: unknown paths, missing portrait, missing earlier answers.
  useEffect(() => {
    if (!["", "step", "build", "result"].includes(head)) return go("", true);
    if (scene === "entry" && hasPortrait) return go("step/occasion", true);
    if (scene === "step") {
      if (!step) return go("", true);
      if (step !== "face" && !hasPortrait) return go("", true);
      if (!["face", "occasion"].includes(step) && !moment.occasion) return go("step/occasion", true);
      if (step === "slot" && (!moment.piece || moment.piece === "none")) return go("step/piece", true);
    }
    if ((scene === "build" || scene === "result") && (!hasPortrait || !moment.occasion)) return go("", true);
  }, [head, scene, step, hasPortrait, moment.occasion, moment.piece, go]);

  const looks = useMemo(() => {
    if (!moment.occasion) return [];
    const ordered = orderByVibe(getLooks(moment.occasion), moment.vibe);
    const piece = moment.piece;
    if (piece && piece !== "none" && piece.slot) return ordered.map((l) => withOwnedItem(l, piece.slot as Slot, piece.name));
    return ordered;
  }, [moment.occasion, moment.vibe, moment.piece]);

  const answer = (id: string) => {
    if (!step) return;
    const wait = reduced ? 150 : ADVANCE_MS;
    if (step === "occasion" && returning) {
      journey.setMoment(quickMoment(id as OccasionId, store.dna?.lifestyle ?? null));
      later(() => go("build"), wait);
      return;
    }
    if (step === "occasion") journey.answerMoment("occasion", id as OccasionId);
    if (step === "venue") journey.answerMoment("venue", id);
    if (step === "time") journey.answerMoment("time", id as TimeId);
    if (step === "vibe") journey.answerMoment("vibe", id as VibeId);
    if (step === "spend") journey.answerMoment("spend", id as SpendId);
    if (step === "piece") {
      setPieceError(null);
      if (id === "upload") return pieceFile.current?.click();
      if (id === "sample") journey.answerMoment("piece", SAMPLE_PIECE);
      if (id === "none") journey.answerMoment("piece", "none");
      later(() => go(id === "none" ? "build" : "step/slot"), wait);
      return;
    }
    if (step === "slot" && moment.piece && moment.piece !== "none") {
      journey.answerMoment("piece", { ...moment.piece, slot: id as Slot });
      later(() => go("build"), wait);
      return;
    }
    const next = AFTER_STEPS[step];
    if (next) later(() => go(`step/${next}`), wait);
  };

  const onPieceFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const image = await readImageFile(file);
      journey.answerMoment("piece", { name: "Your piece", image, slot: null });
      later(() => go("step/slot"), reduced ? 150 : ADVANCE_MS);
    } catch {
      setPieceError(UPLOAD_ERROR);
    }
  };

  const onBuildProgress = useCallback((progress: number, label: string | null) => setBuild({ progress, label }), []);
  const onBuildDone = useCallback(() => go("result/0", true), [go]);

  const index = Math.min(Math.max(0, Number.parseInt(second ?? "0", 10) || 0), Math.max(0, looks.length - 1));
  const detail = scene === "result" && third === "detail";
  const look = looks[index];
  const savedEntry = look ? store.looks.find((s) => s.look.id === look.id) : undefined;
  const occasionText = occasionLabel(moment.occasion);
  const wash = scene !== "entry" && step !== "face" && moment.occasion ? WASHES[moment.occasion] : null;
  const question = step ? MOMENT_QUESTIONS[step] : "";
  const options = step ? momentOptions(step, moment) : [];
  const value = step ? momentValue(step, moment) : null;
  const hint = options.find((o) => o.id === focused)?.hint ?? null;
  const showStepIn = scene === "entry" || step === "face";
  // Reactions accumulate in step order, so Back to an earlier question undoes the later ones.
  const depth = scene === "build" ? MOMENT_STEPS.length : step ? MOMENT_STEPS.indexOf(step) : -1;

  const frame =
    scene === "result" && look ? (
      <Deck
        label="Your looks"
        items={looks.map((l) => ({ id: l.id, image: l.image, alt: `${l.title}, rendered on you` }))}
        index={index}
        onIndex={(i) => go(`result/${i}`, true)}
        onOpen={(i) => go(`result/${i}/detail`)}
        openLabel="Open details"
        under={portraitSrc}
        note="Rendered on you"
      />
    ) : (
      <>
        <Frame
          image={portraitSrc}
          alt={hasPortrait && journey.journey.portrait?.kind === "captured" ? "You" : "The stand-in"}
          stream={showStepIn ? stepIn.stream : null}
          videoRef={stepIn.videoRef}
          wash={wash}
          light={reached(depth, "time") ? moment.time : null}
          ghost={reached(depth, "vibe") && moment.vibe && looks.length > 0 ? looks[0].image : null}
          piece={reached(depth, "piece") ? moment.piece : null}
          caption={showStepIn ? "Step in." : momentCaption(moment, depth)}
          ring={{ progress: build.progress, active: scene === "build" }}
          dim={scene === "build"}
        />
        {store.dna && <Signature tones={store.dna.tones} answers={{ fit: store.dna.fit, lifestyle: store.dna.lifestyle, presetIds: store.dna.presetIds }} />}
      </>
    );

  let rail: React.ReactNode;
  if (showStepIn) {
    rail = (
      <>
        {stepIn.rail}
        {scene === "entry" && (
          <Quiet onClick={() => go("dna/face")} className="lg:-ml-2">
            Or build your Style DNA first
          </Quiet>
        )}
      </>
    );
  } else if (scene === "step" && step) {
    rail = (
      <>
        <h1 className="text-[18px] font-medium">{question}</h1>
        <Dial key={step} label={question} options={options} selected={value ? [value] : []} onSelect={answer} onFocusChange={setFocused} />
        <Status text={pieceError ?? hint} />
        <div className="flex items-center gap-1 lg:-ml-2">
          {step === "occasion" ? (
            <Quiet onClick={() => go("step/face")}>Change photo</Quiet>
          ) : (
            <Quiet onClick={() => window.history.back()}>Back</Quiet>
          )}
        </div>
        <input ref={pieceFile} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPieceFile} />
      </>
    );
  } else if (scene === "build") {
    rail = (
      <>
        <BuildRunner key={location.key} stages={MOMENT_STAGES} onProgress={onBuildProgress} onDone={onBuildDone} />
        <h1 className="text-[18px] font-medium" aria-live="polite">
          {build.label ?? "Reading the occasion"}
        </h1>
        <p className="text-[16px] text-[var(--muted)]">Three looks for {occasionText.toLowerCase()}, rendered on you.</p>
      </>
    );
  } else if (look) {
    rail = (
      <>
        <p className="text-[14px] font-medium text-[var(--muted)]">{lookLabel(look, index)}</p>
        <h1 className="c-display text-[22px] lg:text-[26px]">{look.title}</h1>
        <p className="max-w-[36ch] text-[16px] text-[var(--text)]">{look.why}</p>
        <Dots labels={looks.map((l, i) => `${lookLabel(l, i)}: ${l.title}`)} index={index} onIndex={(i) => go(`result/${i}`, true)} />
        <div className="flex items-center gap-3">
          <Primary onClick={() => go(`result/${index}/detail`)}>This one</Primary>
          <Quiet onClick={() => go("step/venue")}>Change the details</Quiet>
        </div>
      </>
    );
  }

  const sheet = look && (
    <Sheet open={detail} label={`${look.title} details`} onClose={() => go(`result/${index}`, true)}>
      <LookDetails
        look={look}
        occasionLabel={occasionText}
        saved={Boolean(savedEntry)}
        onSave={() => (savedEntry ? store.removeLook(savedEntry.id) : store.saveLook(look, occasionText, look.image))}
        onClose={() => go(`result/${index}`, true)}
      />
    </Sheet>
  );

  return <Stage frame={frame} rail={rail} wash={wash} sheet={sheet} />;
}
