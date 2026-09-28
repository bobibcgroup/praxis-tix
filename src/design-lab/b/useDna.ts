import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FITS, LIFESTYLES, SAMPLE_TONES, STAND_IN_PORTRAIT, STYLE_PRESETS, type FitId, type LifestyleId } from "../shared/catalog";
import { DNA_STAGES, useGuidedBuild, type GuidedBuildState } from "../shared/guided";
import type { SavedDna } from "../shared/store";
import { BASE, type CaptureValue, type Captures, type LabStore } from "./model";
import { pickValid, useQuery } from "./params";

export type DnaLine = "face" | "fit" | "week" | "inspo";
export const DNA_LINES: readonly DnaLine[] = ["face", "fit", "week", "inspo"];

const SOURCES = [{ id: "sample" as const }, { id: "camera" as const }, { id: "upload" as const }];

export interface DnaController {
  store: LabStore;
  face: CaptureValue | null;
  setFace: (value: CaptureValue | null) => void;
  fit: FitId | null;
  week: LifestyleId | null;
  inspo: string[];
  choose: (line: "fit" | "week", id: string) => void;
  toggleInspo: (id: string) => void;
  openLine: DnaLine | null;
  toggleLine: (line: DnaLine) => void;
  complete: boolean;
  phase: "idle" | "building";
  build: GuidedBuildState;
  hasBuilt: boolean;
  resolved: boolean;
  result: SavedDna | null;
  resolve: () => void;
  redo: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}

interface Filled {
  face: CaptureValue | null;
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

/** The DNA journey: the same line mechanism, four lines, DNA stages, then a saved header. */
export function useDna(store: LabStore, captures: Captures, setCaptures: (fn: (prev: Captures) => Captures) => void): DnaController {
  const { params, patch } = useQuery();
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  const faceSource = pickValid(params.get("face"), SOURCES);
  const face: CaptureValue | null = useMemo(() => {
    if (!faceSource) return null;
    if (faceSource === "sample" || !captures.dnaFace) return { source: "sample", image: STAND_IN_PORTRAIT };
    return { source: faceSource, image: captures.dnaFace };
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
  const resolved = params.get("resolved") === "1" && store.dna !== null;

  const [phase, setPhase] = useState<"idle" | "building">("idle");
  const [runKey, setRunKey] = useState(0);
  const [hasBuilt, setHasBuilt] = useState(false);
  const [openLine, setOpenLine] = useState<DnaLine | null>(() => (params.get("resolved") === "1" ? null : firstEmpty(filled)));
  const [sheetOpen, setSheetOpen] = useState(true);

  const build = useGuidedBuild(DNA_STAGES, phase === "building", runKey, reduced);

  const latest = useRef({ filled, patch, store });
  latest.current = { filled, patch, store };
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
    const { filled: f, patch: p, store: s } = latest.current;
    s.saveDna({
      createdAt: new Date().toISOString(),
      tones: SAMPLE_TONES,
      fit: f.fit,
      lifestyle: f.week,
      presetIds: f.inspo,
      portrait: f.face?.image ?? STAND_IN_PORTRAIT,
    });
    setHasBuilt(true);
    setPhase("idle");
    setSheetOpen(true);
    p({ resolved: "1" });
  }, [phase, build.done]);

  const toggleLine = useCallback((line: DnaLine) => setOpenLine((prev) => (prev === line ? null : line)), []);

  const setFace = useCallback(
    (value: CaptureValue | null) => {
      const session = value && value.source !== "sample" ? value.image : undefined;
      setCaptures((prev) => ({ ...prev, dnaFace: session }));
      patch({ face: value?.source ?? null });
      setOpenLine(value ? firstEmpty({ ...filled, face: value }) : "face");
    },
    [patch, setCaptures, filled],
  );

  const choose = useCallback(
    (line: "fit" | "week", id: string) => {
      patch({ [line]: id });
      setOpenLine(firstEmpty({ ...filled, [line]: id }));
    },
    [patch, filled],
  );

  const toggleInspo = useCallback(
    (id: string) => {
      const next = inspo.includes(id) ? inspo.filter((x) => x !== id) : inspo.length >= 2 ? [inspo[1], id] : [...inspo, id];
      patch({ inspo: next.join(",") });
      if (next.length === 2) setOpenLine(null);
    },
    [inspo, patch],
  );

  const resolve = useCallback(() => {
    patch({ face: face?.source ?? null, fit, week, inspo: inspo.join(",") });
    setOpenLine(null);
    setRunKey((k) => k + 1);
    setPhase("building");
  }, [patch, face, fit, week, inspo]);

  const redo = useCallback(() => {
    navigate(`${BASE}/dna`);
    setHasBuilt(false);
    setPhase("idle");
    setOpenLine("face");
  }, [navigate]);

  const drawerOpen = params.get("drawer") === "looks";
  const openDrawer = useCallback(() => patch({ drawer: "looks" }), [patch]);
  const closeDrawer = useCallback(() => patch({ drawer: null }), [patch]);

  return {
    store,
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
    phase,
    build,
    hasBuilt,
    resolved,
    result: resolved ? store.dna : null,
    resolve,
    redo,
    drawerOpen,
    openDrawer,
    closeDrawer,
    sheetOpen,
    setSheetOpen,
  };
}
