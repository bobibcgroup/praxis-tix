import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Look } from "../shared/catalog";
import { MOMENT_STAGES, TRYON_STAGES, useGuidedBuild, type BuildStage, type GuidedBuildState } from "../shared/guided";
import {
  REBUILD_STAGES,
  briefSentence,
  composeLooks,
  defaultHeroId,
  filledCount,
  isComplete,
  nextEmpty,
  occasionLabel,
  readFace,
  readPiece,
  readValues,
  type BriefValues,
  type Captures,
  type FaceValue,
  type LabStore,
  type LineId,
  type LineNotes,
  type PieceInput,
} from "./model";
import { useQuery, type ParamPatch } from "./params";

export type Phase = "idle" | "building" | "rebuilding";
export type OpenLine = LineId | "with" | null;
export type DrawerKind = "looks" | "you" | "buy" | "share";
export type DoneKind = "saved" | "reserved" | "dna";

const STORE_KEY = "praxis_lab_d";

/**
 * The shared store reads localStorage in an effect, so its first render is
 * empty. This synchronous read keeps the welcome from flashing for a
 * returning user who has saved looks or a DNA.
 */
function readStoredContent(): boolean {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { looks?: unknown[]; dna?: unknown };
    return (parsed.looks?.length ?? 0) > 0 || Boolean(parsed.dna);
  } catch {
    return false;
  }
}

interface Snapshot {
  values: BriefValues;
  piece: PieceInput | null;
}

export interface BriefController {
  store: LabStore;
  reduced: boolean;
  values: BriefValues;
  notes: LineNotes;
  complete: boolean;
  filled: number;
  sentence: string;
  occasion: string;
  openLine: OpenLine;
  toggleLine: (line: OpenLine) => void;
  choose: (line: LineId, id: string) => void;
  face: FaceValue | null;
  faceNote?: string;
  setFace: (value: FaceValue | null) => void;
  piece: PieceInput | null;
  setPiece: (value: PieceInput | null) => void;
  stream: MediaStream | null;
  setStream: (stream: MediaStream | null) => void;
  phase: Phase;
  stages: readonly BuildStage[];
  build: GuidedBuildState;
  hasBuilt: boolean;
  resolved: boolean;
  resolve: () => void;
  newBrief: () => void;
  looks: Look[];
  hero: Look | null;
  swapHero: (id: string) => void;
  tryon: boolean;
  setTryon: (on: boolean) => void;
  tryonBuild: GuidedBuildState;
  savedHero: boolean;
  save: (tryOnImage?: string) => void;
  drawer: DrawerKind | null;
  openDrawer: (kind: DrawerKind) => void;
  closeDrawer: () => void;
  /** Mobile only: the brief reopened over the result details. */
  briefExpanded: boolean;
  setBriefExpanded: (open: boolean) => void;
  dnaMode: boolean;
  enterDna: () => void;
  /** Nothing in progress, nothing saved: what the product is, then one action. */
  welcome: boolean;
  start: () => void;
  /** Completion state after save, reserve or DNA save. */
  done: DoneKind | null;
  markDone: (kind: DoneKind) => void;
  /** Any line answered, results shown, or a completion: the brief has begun. */
  begun: boolean;
}

const DRAWERS: readonly DrawerKind[] = ["looks", "you", "buy", "share"];
const DONE: readonly DoneKind[] = ["saved", "reserved", "dna"];
const CLEAR: ParamPatch = {
  for: null,
  where: null,
  when: null,
  feel: null,
  spend: null,
  piece: null,
  pieceSrc: null,
  hero: null,
  resolved: null,
  tryon: null,
  drawer: null,
  done: null,
  dna: null,
  dface: null,
  fit: null,
  week: null,
  inspo: null,
  dresolved: null,
};

/**
 * Owns the whole brief on one page: which line is open, what the URL says,
 * when a build runs, and which snapshot of the brief the looks came from.
 */
export function useBrief(store: LabStore, captures: Captures, setCaptures: (fn: (prev: Captures) => Captures) => void): BriefController {
  const { params, patch } = useQuery();
  const reduced = useReducedMotion() ?? false;
  const dna = store.dna;

  const { values, notes } = useMemo(() => readValues(params, dna), [params, dna]);
  const complete = isComplete(values);
  const resolved = params.get("resolved") === "1";
  const tryon = resolved && params.get("tryon") === "1";
  const heroId = params.get("hero");
  const faceRead = useMemo(() => readFace(params, captures, dna), [params, captures, dna]);
  const piece = useMemo(() => readPiece(params, captures), [params, captures]);
  const dnaMode = params.get("dna") === "1";
  const doneParam = params.get("done");
  const done = DONE.find((k) => k === doneParam) ?? null;

  const [phase, setPhase] = useState<Phase>("idle");
  const [kind, setKind] = useState<"full" | "short">("full");
  const [runKey, setRunKey] = useState(0);
  const [hasBuilt, setHasBuilt] = useState(false);
  const [openLine, setOpenLine] = useState<OpenLine>(() => (resolved ? null : nextEmpty(values)));
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() => (resolved ? { values, piece } : null));
  const [savedIds, setSavedIds] = useState<readonly string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [briefExpanded, setBriefExpanded] = useState(false);
  const [started, setStarted] = useState(false);
  const [stored] = useState<boolean>(() => readStoredContent());

  const stages = kind === "full" ? MOMENT_STAGES : REBUILD_STAGES;
  const build = useGuidedBuild(stages, phase !== "idle", runKey, reduced);

  const looks = useMemo(() => {
    const shown = snapshot ?? (resolved ? { values, piece } : null);
    return shown ? composeLooks(shown.values, shown.piece) : [];
  }, [snapshot, resolved, values, piece]);
  const hero = useMemo(() => looks.find((l) => l.id === heroId) ?? looks.find((l) => l.id === defaultHeroId(looks, values.feel)) ?? null, [looks, heroId, values.feel]);

  const tryonBuild = useGuidedBuild(TRYON_STAGES, tryon && phase === "idle", `${hero?.id ?? ""}:${runKey}`, reduced);

  const latest = useRef({ values, piece, resolved, patch });
  latest.current = { values, piece, resolved, patch };
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
    const current = latest.current;
    setSnapshot({ values: current.values, piece: current.piece });
    setHasBuilt(true);
    setPhase("idle");
    setBriefExpanded(false);
    const fresh = composeLooks(current.values, current.piece);
    current.patch({ resolved: "1", hero: defaultHeroId(fresh, current.values.feel) });
  }, [phase, build.done]);

  const startBuild = useCallback((next: "full" | "short") => {
    setKind(next);
    setRunKey((key) => key + 1);
    setPhase(next === "full" ? "building" : "rebuilding");
  }, []);

  const toggleLine = useCallback((line: OpenLine) => setOpenLine((prev) => (prev === line ? null : line)), []);

  const markStarted = useCallback(() => setStarted(true), []);

  const start = useCallback(() => {
    markStarted();
    setOpenLine("for");
  }, [markStarted]);

  const choose = useCallback(
    (line: LineId, id: string) => {
      const changes: ParamPatch = { [line]: id, hero: null, tryon: null, done: null };
      if (line === "for") changes.where = null;
      patch(changes);
      markStarted();
      const next = { ...values, [line]: id, ...(line === "for" ? { where: null } : {}) } as BriefValues;
      const empty = nextEmpty(next);
      const withYouEmpty = !faceRead.face && !piece;
      setOpenLine(empty ?? (!resolved && withYouEmpty ? "with" : null));
      if (resolved && isComplete(next)) startBuild("short");
    },
    [patch, values, faceRead.face, piece, resolved, startBuild, markStarted],
  );

  const setFace = useCallback(
    (value: FaceValue | null) => {
      setCaptures((prev) => ({ ...prev, face: value?.source === "own" ? value.image : undefined }));
      patch({ face: value ? value.source : dna?.portrait ? "none" : null });
    },
    [patch, setCaptures, dna],
  );

  const setPiece = useCallback(
    (value: PieceInput | null) => {
      setCaptures((prev) => ({ ...prev, piece: value?.source === "own" && value.image ? value.image : undefined }));
      patch({ piece: value?.slot ?? null, pieceSrc: value?.source ?? null, hero: null, tryon: null, done: null });
      if (resolved && complete) startBuild("short");
    },
    [patch, setCaptures, resolved, complete, startBuild],
  );

  const resolve = useCallback(() => {
    patch({ for: values.for, where: values.where, when: values.when, feel: values.feel, spend: values.spend, done: null });
    setOpenLine(null);
    markStarted();
    startBuild("full");
  }, [patch, values, startBuild, markStarted]);

  /** Resets the brief. The face on file and the saved DNA stay. */
  const newBrief = useCallback(() => {
    patch(CLEAR);
    markStarted();
    setSnapshot(null);
    setHasBuilt(false);
    setPhase("idle");
    setOpenLine("for");
    setSavedIds([]);
    setBriefExpanded(false);
  }, [patch, markStarted]);

  const swapHero = useCallback((id: string) => patch({ hero: id, done: null }), [patch]);
  const setTryon = useCallback((on: boolean) => patch({ tryon: on ? "1" : null, drawer: null, done: null }), [patch]);
  const markDone = useCallback((kind: DoneKind) => patch({ done: kind, drawer: null }), [patch]);

  const save = useCallback(
    (tryOnImage?: string) => {
      if (!hero) return;
      store.saveLook(hero, occasionLabel(values), tryOnImage);
      setSavedIds((prev) => [...prev, hero.id]);
    },
    [hero, store, values],
  );

  const drawerParam = params.get("drawer");
  const drawer = DRAWERS.find((d) => d === drawerParam) ?? null;
  const openDrawer = useCallback((next: DrawerKind) => patch({ drawer: next }), [patch]);
  const closeDrawer = useCallback(() => patch({ drawer: null }), [patch]);
  const enterDna = useCallback(() => {
    markStarted();
    patch({ dna: "1", drawer: null, done: null });
  }, [patch, markStarted]);

  const begun = Boolean(values.for || resolved || done);
  const welcome = !started && !dnaMode && !begun && !stored && store.looks.length === 0 && store.dna === null;

  return {
    store,
    reduced,
    values,
    notes,
    complete,
    filled: filledCount(values, Boolean(faceRead.face || piece)),
    sentence: briefSentence(values),
    occasion: occasionLabel(values),
    openLine,
    toggleLine,
    choose,
    face: faceRead.face,
    faceNote: faceRead.note,
    setFace,
    piece,
    setPiece,
    stream,
    setStream,
    phase,
    stages,
    build,
    hasBuilt,
    resolved,
    resolve,
    newBrief,
    looks,
    hero,
    swapHero,
    tryon,
    setTryon,
    tryonBuild,
    savedHero: hero ? savedIds.includes(hero.id) || store.looks.some((s) => s.look.id === hero.id && s.occasionLabel === occasionLabel(values)) : false,
    save,
    drawer,
    openDrawer,
    closeDrawer,
    briefExpanded,
    setBriefExpanded,
    dnaMode,
    enterDna,
    welcome,
    start,
    done,
    markDone,
    begun,
  };
}
