import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FITS, LIFESTYLES, SAMPLE_TONES, STAND_IN_PORTRAIT, STYLE_PRESETS, type FitId, type LifestyleId } from "../shared/catalog";
import { DNA_STAGES, useGuidedBuild, type GuidedBuildState } from "../shared/guided";
import type { SavedDna } from "../shared/store";
import type { Captures, FaceValue, LabStore } from "./model";
import { pickValid, useQuery, type ParamPatch } from "./params";

export type DnaLine = "face" | "fit" | "week" | "inspo";
export const DNA_LINES: readonly DnaLine[] = ["face", "fit", "week", "inspo"];
export const DNA_LABEL: Record<DnaLine, string> = { face: "Face", fit: "Fit", week: "Week", inspo: "Inspiration" };

const SOURCES = [{ id: "sample" as const }, { id: "own" as const }];
const CLEAR: ParamPatch = { dface: null, fit: null, week: null, inspo: null, dresolved: null };

export interface DnaController {
  face: FaceValue | null;
  setFace: (value: FaceValue | null) => void;
  fit: FitId | null;
  week: LifestyleId | null;
  inspo: string[];
  choose: (line: "fit" | "week", id: string) => void;
  toggleInspo: (id: string) => void;
  openLine: DnaLine | null;
  toggleLine: (line: DnaLine) => void;
  complete: boolean;
  filled: number;
  phase: "idle" | "building";
  build: GuidedBuildState;
  resolved: boolean;
  /** The result to show once the build has run, before it is saved. */
  result: SavedDna | null;
  resolve: () => void;
  save: () => void;
  redo: () => void;
  exit: () => void;
  stream: MediaStream | null;
  setStream: (stream: MediaStream | null) => void;
}

interface Filled {
  face: FaceValue | null;
  fit: FitId | null;
  week: LifestyleId | null;
  inspo: string[];
}

function firstEmpty(filled: Filled): DnaLine | null {
  if (!filled.face) return "face";
  if (!filled.fit) return "fit";
  if (!filled.week) return "week";
  if (filled.inspo.length === 0) return "inspo";
  return null;
}

/** The DNA journey on the same page: four lines, the DNA stages, a result, then a saved header. */
export function useDna(store: LabStore, captures: Captures, setCaptures: (fn: (prev: Captures) => Captures) => void): DnaController {
  const { params, patch } = useQuery();
  const reduced = useReducedMotion() ?? false;

  const faceSource = pickValid(params.get("dface"), SOURCES);
  const face: FaceValue | null = useMemo(() => {
    if (!faceSource) return null;
    if (faceSource === "sample" || !captures.dnaFace) return { source: "sample", image: STAND_IN_PORTRAIT };
    return { source: "own", image: captures.dnaFace };
  }, [faceSource, captures.dnaFace]);
  const fit = pickValid(params.get("fit"), FITS);
  const week = pickValid(params.get("week"), LIFESTYLES);
  const inspo = useMemo(
    () =>
      (params.get("inspo") ?? "")
        .split(",")
        .filter((id) => STYLE_PRESETS.some((p) => p.id === id))
        .slice(0, 2),
    [params],
  );
  const filled: Filled = useMemo(() => ({ face, fit, week, inspo }), [face, fit, week, inspo]);
  const complete = firstEmpty(filled) === null;
  const resolved = params.get("dresolved") === "1" && complete;

  const [phase, setPhase] = useState<"idle" | "building">("idle");
  const [runKey, setRunKey] = useState(0);
  const [openLine, setOpenLine] = useState<DnaLine | null>(() => (resolved ? null : firstEmpty(filled)));
  const [stream, setStream] = useState<MediaStream | null>(null);

  const build = useGuidedBuild(DNA_STAGES, phase === "building", runKey, reduced);

  const latest = useRef({ patch });
  latest.current = { patch };
  const runningRef = useRef(false);

  useEffect(() => {
    if (phase === "idle") {
      runningRef.current = false;
      return;
    }
    if (!build.done) {
      runningRef.current = true;
      return;
    }
    if (!runningRef.current) return;
    runningRef.current = false;
    setPhase("idle");
    latest.current.patch({ dresolved: "1" });
  }, [phase, build.done]);

  const result = useMemo<SavedDna | null>(
    () =>
      resolved
        ? {
            createdAt: new Date().toISOString(),
            tones: SAMPLE_TONES,
            fit,
            lifestyle: week,
            presetIds: inspo,
            portrait: face?.image ?? STAND_IN_PORTRAIT,
          }
        : null,
    [resolved, fit, week, inspo, face],
  );

  const toggleLine = useCallback((line: DnaLine) => setOpenLine((prev) => (prev === line ? null : line)), []);

  const setFace = useCallback(
    (value: FaceValue | null) => {
      setCaptures((prev) => ({ ...prev, dnaFace: value?.source === "own" ? value.image : undefined }));
      patch({ dface: value?.source ?? null, dresolved: null });
      setOpenLine(value ? firstEmpty({ ...filled, face: value }) : "face");
    },
    [patch, setCaptures, filled],
  );

  const choose = useCallback(
    (line: "fit" | "week", id: string) => {
      patch({ [line]: id, dresolved: null });
      setOpenLine(firstEmpty({ ...filled, [line]: id }));
    },
    [patch, filled],
  );

  const toggleInspo = useCallback(
    (id: string) => {
      const next = inspo.includes(id) ? inspo.filter((x) => x !== id) : inspo.length >= 2 ? [inspo[1], id] : [...inspo, id];
      patch({ inspo: next.join(","), dresolved: null });
      if (next.length === 2) setOpenLine(null);
    },
    [inspo, patch],
  );

  const resolve = useCallback(() => {
    setOpenLine(null);
    setRunKey((k) => k + 1);
    setPhase("building");
  }, []);

  const save = useCallback(() => {
    if (!result) return;
    store.saveDna(result);
    patch({ ...CLEAR, dna: null, done: "dna" });
  }, [result, store, patch]);

  const redo = useCallback(() => {
    patch(CLEAR);
    setPhase("idle");
    setOpenLine("face");
  }, [patch]);

  const exit = useCallback(() => patch({ ...CLEAR, dna: null }), [patch]);

  return {
    face,
    setFace,
    fit,
    week,
    inspo,
    choose,
    toggleInspo,
    openLine,
    toggleLine,
    complete,
    filled: [face, fit, week, inspo.length > 0].filter(Boolean).length,
    phase,
    build,
    resolved,
    result,
    resolve,
    save,
    redo,
    exit,
    stream,
    setStream,
  };
}
