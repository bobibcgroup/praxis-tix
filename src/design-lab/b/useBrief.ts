import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Look } from "../shared/catalog";
import { MOMENT_STAGES, useGuidedBuild, type BuildStage, type GuidedBuildState } from "../shared/guided";
import {
  BASE,
  REBUILD_STAGES,
  briefSentence,
  composeLooks,
  isComplete,
  nextEmpty,
  occasionLabel,
  readFace,
  readPiece,
  readValues,
  type BriefValues,
  type CaptureValue,
  type Captures,
  type LabStore,
  type LineId,
  type LineNotes,
  type PieceInput,
} from "./model";
import { useQuery, type ParamPatch } from "./params";

export type Phase = "idle" | "building" | "rebuilding";
export type OpenLine = LineId | "with" | null;
export type DrawerKind = "looks" | "buy" | "share";

interface Snapshot {
  values: BriefValues;
  piece: PieceInput | null;
}

export interface BriefController {
  store: LabStore;
  values: BriefValues;
  notes: LineNotes;
  complete: boolean;
  sentence: string;
  occasion: string;
  openLine: OpenLine;
  toggleLine: (line: OpenLine) => void;
  choose: (line: LineId, id: string) => void;
  face: CaptureValue | null;
  faceNote?: string;
  setFace: (value: CaptureValue | null) => void;
  piece: PieceInput | null;
  setPiece: (value: PieceInput | null) => void;
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
  savedHero: boolean;
  save: (tryOnImage?: string) => void;
  drawer: DrawerKind | null;
  openDrawer: (kind: DrawerKind) => void;
  closeDrawer: () => void;
  youOpen: boolean;
  toggleYou: () => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}

const DRAWERS: readonly DrawerKind[] = ["looks", "buy", "share"];

/**
 * Owns the whole brief: which line is open, what the URL says, when a build
 * runs, and which snapshot of the brief the looks were composed from.
 */
export function useBrief(
  store: LabStore,
  captures: Captures,
  setCaptures: (fn: (prev: Captures) => Captures) => void,
  library: boolean,
): BriefController {
  const { params, patch } = useQuery();
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;
  const dna = store.dna;

  const { values, notes } = useMemo(() => readValues(params, dna), [params, dna]);
  const complete = isComplete(values);
  const resolved = params.get("resolved") === "1";
  const tryon = resolved && params.get("tryon") === "1";
  const heroId = params.get("hero");
  const faceRead = useMemo(() => readFace(params, captures, dna), [params, captures, dna]);
  const piece = useMemo(() => readPiece(params, captures), [params, captures]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [kind, setKind] = useState<"full" | "short">("full");
  const [runKey, setRunKey] = useState(0);
  const [hasBuilt, setHasBuilt] = useState(false);
  const [openLine, setOpenLine] = useState<OpenLine>(() => (resolved ? null : nextEmpty(values)));
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() => (resolved ? { values, piece } : null));
  const [sheetOpen, setSheetOpen] = useState(true);
  const [savedIds, setSavedIds] = useState<readonly string[]>([]);

  const stages = kind === "full" ? MOMENT_STAGES : REBUILD_STAGES;
  const build = useGuidedBuild(stages, phase !== "idle", runKey, reduced);

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
    setSheetOpen(true);
    if (!current.resolved) current.patch({ resolved: "1" });
  }, [phase, build.done]);

  const startBuild = useCallback((next: "full" | "short") => {
    setKind(next);
    setRunKey((key) => key + 1);
    setPhase(next === "full" ? "building" : "rebuilding");
  }, []);

  const looks = useMemo(() => {
    const shown = snapshot ?? (resolved ? { values, piece } : null);
    return shown ? composeLooks(shown.values, shown.piece, heroId) : [];
  }, [snapshot, resolved, values, piece, heroId]);
  const hero = looks[0] ?? null;

  const youOpen = params.get("you") === "1";

  const toggleLine = useCallback(
    (line: OpenLine) => {
      setOpenLine((prev) => (prev === line ? null : line));
      if (youOpen) patch({ you: null });
    },
    [youOpen, patch],
  );

  const choose = useCallback(
    (line: LineId, id: string) => {
      const changes: ParamPatch = { [line]: id, hero: null, tryon: null };
      if (line === "for") changes.where = null;
      patch(changes);
      const next = { ...values, [line]: id, ...(line === "for" ? { where: null } : {}) } as BriefValues;
      const empty = nextEmpty(next);
      const withYouEmpty = !faceRead.face && !piece;
      setOpenLine(empty ?? (!resolved && withYouEmpty ? "with" : null));
      if (resolved && isComplete(next)) startBuild("short");
    },
    [patch, values, faceRead.face, piece, resolved, startBuild],
  );

  const setFace = useCallback(
    (value: CaptureValue | null) => {
      const session = value && (value.source === "camera" || value.source === "upload") ? value.image : undefined;
      setCaptures((prev) => ({ ...prev, face: session }));
      patch({ face: value ? value.source : dna?.portrait ? "none" : null });
    },
    [patch, setCaptures, dna],
  );

  const setPiece = useCallback(
    (value: PieceInput | null) => {
      const session = value && (value.source === "camera" || value.source === "upload") ? value.image : undefined;
      setCaptures((prev) => ({ ...prev, piece: session }));
      patch({ piece: value?.slot ?? null, pieceSrc: value?.source ?? null, hero: null, tryon: null });
      if (resolved && complete) startBuild("short");
    },
    [patch, setCaptures, resolved, complete, startBuild],
  );

  const resolve = useCallback(() => {
    patch({
      for: values.for,
      where: values.where,
      when: values.when,
      feel: values.feel,
      spend: values.spend,
      face: faceRead.face ? faceRead.face.source : null,
      piece: piece?.slot ?? null,
      pieceSrc: piece?.source ?? null,
    });
    setOpenLine(null);
    startBuild("full");
  }, [patch, values, faceRead.face, piece, startBuild]);

  const newBrief = useCallback(() => {
    navigate(BASE);
    setSnapshot(null);
    setHasBuilt(false);
    setPhase("idle");
    setOpenLine("for");
    setSavedIds([]);
  }, [navigate]);

  const swapHero = useCallback((id: string) => patch({ hero: id, tryon: null }), [patch]);
  const setTryon = useCallback((on: boolean) => patch({ tryon: on ? "1" : null }), [patch]);

  const save = useCallback(
    (tryOnImage?: string) => {
      if (!hero) return;
      store.saveLook(hero, occasionLabel(values), tryOnImage);
      setSavedIds((prev) => [...prev, hero.id]);
    },
    [hero, store, values],
  );

  const drawerParam = params.get("drawer");
  const drawer: DrawerKind | null = library ? "looks" : DRAWERS.find((d) => d === drawerParam) ?? null;

  const openDrawer = useCallback(
    (next: DrawerKind) => {
      if (next === "looks") {
        const search = new URLSearchParams(params);
        search.delete("drawer");
        const query = search.toString();
        navigate(`${BASE}/looks${query ? `?${query}` : ""}`);
        return;
      }
      patch({ drawer: next });
    },
    [navigate, params, patch],
  );

  const closeDrawer = useCallback(() => {
    if (library) {
      const query = params.toString();
      navigate(`${BASE}${query ? `?${query}` : ""}`);
      return;
    }
    patch({ drawer: null });
  }, [library, navigate, params, patch]);

  const toggleYou = useCallback(() => {
    if (!dna) {
      navigate(`${BASE}/dna`);
      return;
    }
    if (!youOpen) setOpenLine(null);
    patch({ you: youOpen ? null : "1" });
  }, [dna, navigate, patch, youOpen]);

  return {
    store,
    values,
    notes,
    complete,
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
    savedHero: hero ? savedIds.includes(hero.id) : false,
    save,
    drawer,
    openDrawer,
    closeDrawer,
    youOpen,
    toggleYou,
    sheetOpen,
    setSheetOpen,
  };
}
