/**
 * Copy, step order and per-answer frame reactions for Concept C.
 * Everything a user reads in the Mirror is written here or in the catalog.
 */
import {
  LIFESTYLES,
  OCCASIONS,
  SPEND,
  STYLE_PRESETS,
  TIMES,
  VENUES,
  VIBES,
  type ChoiceOption,
  type Look,
  type OccasionId,
  type TimeId,
  type VibeId,
} from "../shared/catalog";
import type { DnaAnswers, MomentAnswers, OwnedPiece, Slot } from "./journey";

export const MOMENT_STEPS = ["face", "occasion", "venue", "time", "vibe", "spend", "piece", "slot"] as const;
export type MomentStep = (typeof MOMENT_STEPS)[number];

export const MOMENT_QUESTIONS: Record<MomentStep, string> = {
  face: "Step in.",
  occasion: "What's the occasion?",
  venue: "Where?",
  time: "Day or night?",
  vibe: "How do you want to come across?",
  spend: "What do you want to spend?",
  piece: "Add one of your pieces?",
  slot: "Which piece is it?",
};

export const DNA_STEPS = ["face", "fit", "week", "inspiration", "build"] as const;
export type DnaStep = (typeof DNA_STEPS)[number];

export const DNA_QUESTIONS: Record<DnaStep, string> = {
  face: "Your face, for your tones.",
  fit: "How do you like things to fit?",
  week: "What does your week look like?",
  inspiration: "Pick up to two you admire.",
  build: "Reading you.",
};

/** Desaturated washes drawn behind the portrait per occasion. */
export const WASHES: Record<OccasionId, string> = {
  DINNER: "#3A2F28",
  WORK: "#2B2F36",
  DATE: "#3A2A33",
  WEDDING: "#2E332B",
  PARTY: "#1F2530",
};

export const STEP_IN_OPTIONS: readonly ChoiceOption[] = [
  { id: "camera", label: "Camera", hint: "Reads your tones and renders the looks on you" },
  { id: "upload", label: "Upload a photo", hint: "A clear photo of your face, any light" },
  { id: "standin", label: "Use the stand-in", hint: "A model until you are ready" },
];

export const KEEP_OPTION: ChoiceOption = { id: "keep", label: "Keep this one", hint: "The photo already in the frame" };

export const PIECE_OPTIONS: readonly ChoiceOption[] = [
  { id: "upload", label: "Upload a photo", hint: "The look is built around it" },
  { id: "sample", label: "Use a sample", hint: "A navy overshirt, to see how it works" },
  { id: "none", label: "Not now", hint: "Everything from the catalog" },
];

export const SAMPLE_PIECE: OwnedPiece = { name: "Navy overshirt", image: "/images/dinner_relaxed_01.jpg", slot: null };

export const SLOT_OPTIONS: readonly ChoiceOption<Slot>[] = [
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "shoes", label: "Shoes" },
];

export const CAMERA_ERROR = "The camera is not available here. Upload a photo or use the stand-in.";
export const UPLOAD_ERROR = "That file could not be read. Try another photo.";

/** Options shown on the dial for a given moment step. */
export function momentOptions(step: MomentStep, moment: MomentAnswers): readonly ChoiceOption[] {
  switch (step) {
    case "face":
      return STEP_IN_OPTIONS;
    case "occasion":
      return OCCASIONS.map((o) => ({ id: o.id, label: o.label, hint: o.hint }));
    case "venue":
      return moment.occasion ? VENUES[moment.occasion] : [];
    case "time":
      return TIMES;
    case "vibe":
      return VIBES;
    case "spend":
      return SPEND;
    case "piece":
      return PIECE_OPTIONS;
    case "slot":
      return SLOT_OPTIONS;
  }
}

export function momentValue(step: MomentStep, moment: MomentAnswers): string | null {
  switch (step) {
    case "occasion":
      return moment.occasion;
    case "venue":
      return moment.venue;
    case "time":
      return moment.time;
    case "vibe":
      return moment.vibe;
    case "spend":
      return moment.spend;
    case "piece":
      return moment.piece === "none" ? "none" : moment.piece ? (moment.piece.image === SAMPLE_PIECE.image ? "sample" : "upload") : null;
    case "slot":
      return moment.piece && moment.piece !== "none" ? moment.piece.slot : null;
    default:
      return null;
  }
}

export function occasionLabel(id: OccasionId | null): string {
  return OCCASIONS.find((o) => o.id === id)?.label ?? "";
}

/** True when `step` has been reached at `depth` (the index of the current step). */
export function reached(depth: number, step: MomentStep): boolean {
  return depth >= MOMENT_STEPS.indexOf(step);
}

/** The caption on the frame's lower edge: "Dinner, rooftop, night", built up as far as he has answered. */
export function momentCaption(moment: MomentAnswers, depth: number): string | null {
  if (!moment.occasion) return null;
  const parts = [occasionLabel(moment.occasion)];
  const venue = reached(depth, "venue") ? VENUES[moment.occasion].find((v) => v.id === moment.venue) : null;
  if (venue) parts.push(venue.label.toLowerCase());
  const time = reached(depth, "time") ? TIMES.find((t) => t.id === moment.time) : null;
  if (time) parts.push(time.label.toLowerCase());
  return parts.join(", ");
}

/** Defaults for the returning-user path: one occasion, one tap. */
export function quickMoment(occasion: OccasionId, lifestyle: DnaAnswers["lifestyle"]): MomentAnswers {
  const hour = new Date().getHours();
  const time: TimeId = hour >= 18 || hour < 6 ? "NIGHT" : "DAY";
  const vibe: VibeId = lifestyle === "SOCIAL" ? "SHARP" : lifestyle === "CASUAL" ? "RELAXED" : "SAFE";
  return { occasion, venue: VENUES[occasion][0].id, time, vibe, spend: "ELEVATED", piece: "none" };
}

export function fitLabel(id: DnaAnswers["fit"]): string | null {
  return id ? `${id.charAt(0)}${id.slice(1).toLowerCase()} fit` : null;
}

export function lifestyleLabel(id: DnaAnswers["lifestyle"]): string | null {
  return LIFESTYLES.find((l) => l.id === id)?.label ?? null;
}

export function presetLabels(ids: readonly string[]): string[] {
  return STYLE_PRESETS.filter((p) => ids.includes(p.id)).map((p) => p.label);
}

const TIER_LABELS: Record<Look["tier"], string> = { SAFEST: "Safer", SHARPER: "Sharper", RELAXED: "Relaxed" };

/** The first look is always the pick; the alternates are named by what they change. */
export function lookLabel(look: Look, index: number): string {
  return index === 0 ? "Our pick" : TIER_LABELS[look.tier];
}

export const SLOT_LABELS: Record<Slot | "extras", string> = { top: "Top", bottom: "Bottom", shoes: "Shoes", extras: "Extras" };

export function formatPrice(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
