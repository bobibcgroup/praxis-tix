import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation } from "react-router-dom";
import { FITS, LIFESTYLES, SAMPLE_TONES, STYLE_PRESETS, getLooks, type FitId, type LifestyleId } from "../shared/catalog";
import type { TierType } from "@/lib/outfitLibrary";
import { DNA_STAGES } from "../shared/guided";
import BuildRunner from "./BuildRunner";
import { DNA_QUESTIONS, DNA_STEPS, type DnaStep } from "./content";
import { useGo, useLab, useLater, useRelativePath } from "./context";
import { Primary, Quiet, Status } from "./controls";
import Dial from "./Dial";
import Frame from "./Frame";
import Signature from "./Signature";
import Stage from "./Stage";
import { useStepIn } from "./StepIn";

const ADVANCE_MS = 480;
/** The fit preview is a photographic ghost of a catalog look cut that way. */
const TIER_BY_FIT: Record<FitId, TierType> = { SLIM: "SHARPER", REGULAR: "SAFEST", RELAXED: "RELAXED" };
function ghostForFit(fit: FitId | null): string | null {
  if (!fit) return null;
  return getLooks("DINNER").find((l) => l.tier === TIER_BY_FIT[fit])?.image ?? null;
}
const PRESET_OPTIONS = STYLE_PRESETS.map((p) => ({ id: p.id, label: p.label }));

function isStep(value: string | undefined): value is DnaStep {
  return (DNA_STEPS as readonly string[]).includes(value ?? "");
}

/** The DNA journey on the same dial; the signature strip grows with each answer. */
export default function Dna() {
  const { store, journey, portraitSrc, hasPortrait, reduced } = useLab();
  const go = useGo();
  const later = useLater();
  const location = useLocation();
  const rel = useRelativePath();
  const raw = rel.split("/")[1];
  const step: DnaStep = isStep(raw) ? raw : "face";
  const answers = journey.journey.dna;
  const [focused, setFocused] = useState<string | null>(null);
  const [build, setBuild] = useState<{ progress: number; label: string | null }>({ progress: 0, label: null });

  const stepIn = useStepIn({
    hasPortrait,
    question: DNA_QUESTIONS.face,
    onDone: (portrait) => {
      if (portrait) journey.setPortrait(portrait);
      go("dna/fit");
    },
  });

  useEffect(() => {
    if (!isStep(raw)) return go("dna/face", true);
    if (step !== "face" && !hasPortrait) return go("dna/face", true);
    if (step === "build" && (!answers.fit || !answers.lifestyle || answers.presetIds.length === 0)) return go("dna/fit", true);
  }, [raw, step, hasPortrait, answers.fit, answers.lifestyle, answers.presetIds.length, go]);

  const wait = reduced ? 150 : ADVANCE_MS;

  const togglePreset = (id: string) => {
    const has = answers.presetIds.includes(id);
    const next = has ? answers.presetIds.filter((p) => p !== id) : [...answers.presetIds.slice(-1), id];
    journey.answerDna("presetIds", next);
  };

  const onBuildProgress = useCallback((progress: number, label: string | null) => setBuild({ progress, label }), []);
  const onBuildDone = useCallback(() => {
    const portrait = journey.journey.portrait;
    store.saveDna({
      createdAt: new Date().toISOString(),
      tones: SAMPLE_TONES,
      fit: answers.fit,
      lifestyle: answers.lifestyle,
      presetIds: answers.presetIds,
      portrait: portrait?.kind === "captured" ? portrait.dataUrl : store.dna?.portrait,
    });
    go("you", true);
  }, [answers, journey.journey.portrait, store, go]);

  const tones = hasPortrait && step !== "face" ? SAMPLE_TONES : null;
  const previewId = step === "inspiration" ? (answers.presetIds[answers.presetIds.length - 1] ?? focused) : null;
  const preview = STYLE_PRESETS.find((p) => p.id === previewId);

  const frame = (
    <>
      <Frame
        image={portraitSrc}
        alt={journey.journey.portrait?.kind === "captured" ? "You" : "The stand-in"}
        stream={step === "face" ? stepIn.stream : null}
        videoRef={stepIn.videoRef}
        ghost={step === "face" ? null : ghostForFit(answers.fit)}
        caption={step === "face" ? "Your tones start here." : step === "build" ? "Reading you." : null}
        ring={{ progress: build.progress, active: step === "build" }}
        dim={step === "build"}
      >
        <AnimatePresence>
          {preview && (
            <motion.div
              key={preview.id}
              className="absolute bottom-3 right-3 grid w-[62%] grid-cols-3 gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: reduced ? 0.12 : 0.35 }}
            >
              {preview.images.slice(0, 3).map((src) => (
                <img key={src} src={src} alt={`${preview.label} reference`} draggable={false} className="aspect-[3/4] w-full rounded-lg border border-[var(--edge-strong)] object-cover" />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Frame>
      <Signature tones={tones} answers={answers} reserve />
    </>
  );

  let rail: React.ReactNode;
  if (step === "face") {
    rail = stepIn.rail;
  } else if (step === "fit") {
    rail = (
      <>
        <h1 className="text-[18px] font-medium">{DNA_QUESTIONS.fit}</h1>
        <Dial
          key="fit"
          label={DNA_QUESTIONS.fit}
          options={FITS}
          selected={answers.fit ? [answers.fit] : []}
          onSelect={(id) => {
            journey.answerDna("fit", id as FitId);
            later(() => go("dna/week"), wait);
          }}
          onFocusChange={setFocused}
        />
        <Status text="The cut you reach for, not the one you were told." />
        <Quiet onClick={() => window.history.back()} className="lg:-ml-2">
          Back
        </Quiet>
      </>
    );
  } else if (step === "week") {
    rail = (
      <>
        <h1 className="text-[18px] font-medium">{DNA_QUESTIONS.week}</h1>
        <Dial
          key="week"
          label={DNA_QUESTIONS.week}
          options={LIFESTYLES}
          selected={answers.lifestyle ? [answers.lifestyle] : []}
          onSelect={(id) => {
            journey.answerDna("lifestyle", id as LifestyleId);
            later(() => go("dna/inspiration"), wait);
          }}
          onFocusChange={setFocused}
        />
        <Status text="Sets what the catalog leans toward." />
        <Quiet onClick={() => window.history.back()} className="lg:-ml-2">
          Back
        </Quiet>
      </>
    );
  } else if (step === "inspiration") {
    rail = (
      <>
        <h1 className="text-[18px] font-medium">{DNA_QUESTIONS.inspiration}</h1>
        <Dial key="inspiration" label={DNA_QUESTIONS.inspiration} options={PRESET_OPTIONS} selected={answers.presetIds} onSelect={togglePreset} onFocusChange={setFocused} multi />
        <Status text={answers.presetIds.length === 0 ? "Tap one or two. The frame shows what each means." : `${answers.presetIds.length} of 2 chosen.`} />
        <div className="flex items-center gap-3">
          <Primary onClick={() => go("dna/build")} disabled={answers.presetIds.length === 0} className="disabled:cursor-default disabled:opacity-40">
            Read my DNA
          </Primary>
          <Quiet onClick={() => window.history.back()}>Back</Quiet>
        </div>
      </>
    );
  } else {
    rail = (
      <>
        <BuildRunner key={location.key} stages={DNA_STAGES} onProgress={onBuildProgress} onDone={onBuildDone} />
        <h1 className="text-[18px] font-medium" aria-live="polite">
          {build.label ?? DNA_STAGES[0].label}
        </h1>
        <p className="text-[16px] text-[var(--muted)]">Your signature stays under the frame from now on.</p>
      </>
    );
  }

  return <Stage frame={frame} rail={rail} />;
}
