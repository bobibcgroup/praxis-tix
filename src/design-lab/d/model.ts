/**
 * The brief model: six lines, their options, and how they become looks.
 * Pure functions over URL params so the page can be rebuilt from a link.
 */
import type { BuildStage } from "../shared/guided";
import {
  FITS,
  OCCASIONS,
  SPEND,
  STAND_IN_PORTRAIT,
  TIMES,
  VENUES,
  VIBES,
  getLooks,
  withOwnedItem,
  type ChoiceOption,
  type LifestyleId,
  type Look,
  type OccasionId,
  type Piece,
  type SpendId,
  type TimeId,
  type VibeId,
} from "../shared/catalog";
import type { SavedDna, useLabStore } from "../shared/store";
import { pickValid } from "./params";

export type LabStore = ReturnType<typeof useLabStore>;

export type LineId = "for" | "where" | "when" | "feel" | "spend";
export const LINE_ORDER: readonly LineId[] = ["for", "where", "when", "feel", "spend"];
export const LINE_LABEL: Record<LineId | "with", string> = { for: "For", where: "Where", when: "When", feel: "Feel", spend: "Spend", with: "With you" };

export interface BriefValues {
  for: OccasionId | null;
  where: string | null;
  when: TimeId | null;
  feel: VibeId | null;
  spend: SpendId | null;
}

export type LineNotes = Partial<Record<LineId, string>>;

/** Session-only images from the camera or an upload. Never written to the URL. */
export interface Captures {
  face?: string;
  piece?: string;
  dnaFace?: string;
}

export type FaceSource = "sample" | "own" | "dna";
export interface FaceValue {
  source: FaceSource;
  image: string;
}

export interface PieceInput {
  slot: Piece["slot"];
  source: "sample" | "own";
  name: string;
  image: string | null;
}

export const SLOTS: readonly ChoiceOption<Piece["slot"]>[] = [
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "shoes", label: "Shoes" },
  { id: "extras", label: "Extras" },
];

export const SAMPLE_PIECES: Record<Piece["slot"], string> = {
  top: "Your navy overshirt",
  bottom: "Your charcoal trousers",
  shoes: "Your black loafers",
  extras: "Your steel watch",
};

const OWN_PIECE_NAME: Record<Piece["slot"], string> = {
  top: "Your own top",
  bottom: "Your own trousers",
  shoes: "Your own shoes",
  extras: "Your own accessory",
};

/** The short build that runs when a line is edited after results exist. */
export const REBUILD_STAGES: readonly BuildStage[] = [
  { id: "reread", label: "Re-reading the brief", ms: 500 },
  { id: "adjust", label: "Adjusting the three looks", ms: 900 },
  { id: "render", label: "Rendering", ms: 400 },
];

export function clockTime(now: Date = new Date()): TimeId {
  const hour = now.getHours();
  return hour >= 17 || hour < 5 ? "NIGHT" : "DAY";
}

export function dnaDefaults(dna: SavedDna | null): { feel: VibeId | null; spend: SpendId | null } {
  if (!dna) return { feel: null, spend: null };
  const feel: VibeId = dna.lifestyle === "SOCIAL" ? "SHARP" : dna.lifestyle === "CASUAL" ? "RELAXED" : "SAFE";
  const elevated = dna.presetIds.some((id) => id === "quiet-luxury" || id === "classic-tailored");
  return { feel, spend: elevated ? "ELEVATED" : "SENSIBLE" };
}

const WEEK_SHORT: Record<LifestyleId, string> = { OFFICE: "office", SOCIAL: "nights out", CASUAL: "casual", MIXED: "mixed week" };

export function dnaSummary(dna: SavedDna): string {
  const fit = FITS.find((f) => f.id === dna.fit)?.label.toLowerCase();
  const week = dna.lifestyle ? WEEK_SHORT[dna.lifestyle] : null;
  return [dna.tones.undertone, `${dna.tones.contrast} contrast`, fit, week].filter(Boolean).join(", ");
}

/** Reads the five lines. A saved DNA prefills Feel and Spend, and When comes from the clock. */
export function readValues(params: URLSearchParams, dna: SavedDna | null): { values: BriefValues; notes: LineNotes } {
  const occasion = pickValid(params.get("for"), OCCASIONS);
  const defaults = dnaDefaults(dna);
  const notes: LineNotes = {};

  const feelParam = pickValid(params.get("feel"), VIBES);
  const spendParam = pickValid(params.get("spend"), SPEND);
  const whenParam = pickValid(params.get("when"), TIMES);

  const feel = feelParam ?? defaults.feel;
  const spend = spendParam ?? defaults.spend;
  const when = whenParam ?? (dna ? clockTime() : null);

  if (!feelParam && feel) notes.feel = "from your DNA";
  if (!spendParam && spend) notes.spend = "from your DNA";
  if (!whenParam && when) notes.when = "from the clock";

  return {
    values: {
      for: occasion,
      where: occasion ? pickValid(params.get("where"), VENUES[occasion]) : null,
      when,
      feel,
      spend,
    },
    notes,
  };
}

export function nextEmpty(values: BriefValues): LineId | null {
  return LINE_ORDER.find((line) => values[line] === null) ?? null;
}

export function isComplete(values: BriefValues): boolean {
  return nextEmpty(values) === null;
}

export function filledCount(values: BriefValues, withYou: boolean): number {
  return LINE_ORDER.filter((line) => values[line] !== null).length + (withYou ? 1 : 0);
}

export function optionsFor(line: LineId, values: BriefValues): readonly ChoiceOption[] {
  switch (line) {
    case "for":
      return OCCASIONS;
    case "where":
      return values.for ? VENUES[values.for] : [];
    case "when":
      return TIMES;
    case "feel":
      return VIBES;
    case "spend":
      return SPEND;
  }
}

export function valueLabel(line: LineId, values: BriefValues): string | null {
  const id = values[line];
  if (!id) return null;
  return optionsFor(line, values).find((o) => o.id === id)?.label ?? null;
}

export function briefSentence(values: BriefValues): string {
  return LINE_ORDER.map((line) => valueLabel(line, values))
    .filter(Boolean)
    .join(", ");
}

export function occasionLabel(values: BriefValues): string {
  return valueLabel("for", values) ?? "Moment";
}

/** The three looks in a stable order (safe, sharper, relaxed) so the thumbnails never move. */
export function composeLooks(values: BriefValues, piece: PieceInput | null): Look[] {
  if (!values.for) return [];
  const base = getLooks(values.for);
  return piece ? base.map((look) => withOwnedItem(look, piece.slot, piece.name)) : base;
}

/** The look the chosen feel points at, used as the default hero. */
export function defaultHeroId(looks: Look[], feel: VibeId | null): string | null {
  const wanted = feel === "SHARP" ? "SHARPER" : feel === "RELAXED" ? "RELAXED" : "SAFEST";
  return looks.find((l) => l.tier === wanted)?.id ?? looks[0]?.id ?? null;
}

/** The image the canvas shows before results: the mood, then the chosen tier as a ghost. */
export function previewImage(values: BriefValues): string | null {
  if (!values.for) return null;
  if (values.feel) {
    const looks = getLooks(values.for);
    return looks.find((l) => l.id === defaultHeroId(looks, values.feel))?.image ?? null;
  }
  return OCCASIONS.find((o) => o.id === values.for)?.image ?? null;
}

const FACE_SOURCES = [{ id: "sample" as const }, { id: "own" as const }, { id: "dna" as const }, { id: "none" as const }];

export function readFace(params: URLSearchParams, captures: Captures, dna: SavedDna | null): { face: FaceValue | null; note?: string } {
  const source = pickValid(params.get("face"), FACE_SOURCES);
  if (source === "none") return { face: null };
  if (source === "sample") return { face: { source, image: STAND_IN_PORTRAIT } };
  if (source === "own") return { face: { source: captures.face ? "own" : "sample", image: captures.face ?? STAND_IN_PORTRAIT } };
  if (dna?.portrait) return { face: { source: "dna", image: dna.portrait }, note: "from your DNA" };
  return { face: null };
}

const PIECE_SOURCES = [{ id: "sample" as const }, { id: "own" as const }];

export function readPiece(params: URLSearchParams, captures: Captures): PieceInput | null {
  const slot = pickValid(params.get("piece"), SLOTS);
  if (!slot) return null;
  const source = pickValid(params.get("pieceSrc"), PIECE_SOURCES) ?? "sample";
  if (source === "own" && captures.piece) return { slot, source, name: OWN_PIECE_NAME[slot], image: captures.piece };
  return { slot, source: "sample", name: SAMPLE_PIECES[slot], image: null };
}

export function ownPieceName(slot: Piece["slot"]): string {
  return OWN_PIECE_NAME[slot];
}

export function money(value: number): string {
  return value === 0 ? "Owned" : `$${value.toLocaleString("en-US")}`;
}

/** The shared stand-in is a full-length photo; tighten it to the face when it stands for "you". */
export function faceCropStyle(src: string | null): { transform: string; transformOrigin: string } | undefined {
  return src === STAND_IN_PORTRAIT ? { transform: "scale(2)", transformOrigin: "50% 4%" } : undefined;
}

export const ROLE_LABEL: Record<Look["role"], string> = { hero: "Safe", sharper: "Sharper", relaxed: "Relaxed" };
export const SLOT_LABEL: Record<Piece["slot"], string> = { top: "Top", bottom: "Bottom", shoes: "Shoes", extras: "Extras" };
