/**
 * The brief model: six lines, their options, and how they become looks.
 * Pure functions over URL params so the page can be rebuilt from a link.
 */
import type { BuildStage } from "../shared/guided";
import {
  FITS,
  LIFESTYLES,
  OCCASIONS,
  SPEND,
  STAND_IN_PORTRAIT,
  TIMES,
  VENUES,
  VIBES,
  getLooks,
  orderByVibe,
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

export const BASE = "/__design/b";
export type LabStore = ReturnType<typeof useLabStore>;

export type LineId = "for" | "where" | "when" | "feel" | "spend";
export const LINE_ORDER: readonly LineId[] = ["for", "where", "when", "feel", "spend"];
export const LINE_LABEL: Record<LineId, string> = { for: "For", where: "Where", when: "When", feel: "Feel", spend: "Spend" };

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

export type CaptureSource = "sample" | "camera" | "upload" | "dna";
export interface CaptureValue {
  source: CaptureSource;
  image: string;
}

export interface PieceInput {
  slot: Piece["slot"];
  name: string;
  image: string;
  source: CaptureSource;
}

export const SLOTS: readonly ChoiceOption<Piece["slot"]>[] = [
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "shoes", label: "Shoes" },
  { id: "extras", label: "Extras" },
];

export const SAMPLE_PIECES: Record<Piece["slot"], { name: string; image: string }> = {
  top: { name: "Your navy knit", image: "/images/dinner_safest_01.jpg" },
  bottom: { name: "Your grey wool trousers", image: "/images/work_safest_01.jpg" },
  shoes: { name: "Your black leather boots", image: "/images/date_sharper_01.jpg" },
  extras: { name: "Your tan leather belt", image: "/images/wedding_relaxed_01.jpg" },
};

const OWN_PIECE_NAME: Record<Piece["slot"], string> = {
  top: "Your own top",
  bottom: "Your own trousers",
  shoes: "Your own shoes",
  extras: "Your own accessory",
};

const SOURCES: readonly { id: CaptureSource }[] = [{ id: "sample" }, { id: "camera" }, { id: "upload" }, { id: "dna" }];

export const SOURCE_LABEL: Record<CaptureSource, string> = {
  sample: "Sample",
  camera: "Your photo",
  upload: "Your photo",
  dna: "From your DNA",
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

export function composeLooks(values: BriefValues, piece: PieceInput | null, heroId: string | null): Look[] {
  if (!values.for) return [];
  const base = orderByVibe(getLooks(values.for), values.feel);
  const withPiece = piece ? base.map((look) => withOwnedItem(look, piece.slot, piece.name)) : base;
  if (!heroId) return withPiece;
  const hero = withPiece.find((look) => look.id === heroId);
  return hero ? [hero, ...withPiece.filter((look) => look.id !== heroId)] : withPiece;
}

export function readFace(params: URLSearchParams, captures: Captures, dna: SavedDna | null): { face: CaptureValue | null; note?: string } {
  if (params.get("face") === "none") return { face: null };
  const source = pickValid(params.get("face"), SOURCES);
  if (source === "sample") return { face: { source, image: STAND_IN_PORTRAIT } };
  if (source === "camera" || source === "upload") {
    return captures.face ? { face: { source, image: captures.face } } : { face: { source: "sample", image: STAND_IN_PORTRAIT } };
  }
  if (source === "dna" || (!source && dna?.portrait)) {
    return dna?.portrait ? { face: { source: "dna", image: dna.portrait }, note: "from your DNA" } : { face: null };
  }
  return { face: null };
}

export function readPiece(params: URLSearchParams, captures: Captures): PieceInput | null {
  const slot = pickValid(params.get("piece"), SLOTS);
  if (!slot) return null;
  const source = pickValid(params.get("pieceSrc"), SOURCES) ?? "sample";
  const own = (source === "camera" || source === "upload") && captures.piece;
  return own
    ? { slot, source, name: OWN_PIECE_NAME[slot], image: captures.piece as string }
    : { slot, source: "sample", name: SAMPLE_PIECES[slot].name, image: SAMPLE_PIECES[slot].image };
}

export function formatPrice(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

export function ownPieceName(slot: Piece["slot"]): string {
  return OWN_PIECE_NAME[slot];
}
