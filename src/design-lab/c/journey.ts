/**
 * Session state for the Mirror journey. Persisted to sessionStorage so a
 * reload keeps him in the frame and Back works through the questions.
 * Saved looks and the DNA live in the shared lab store, not here.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FitId, LifestyleId, OccasionId, Piece, SpendId, TimeId, VibeId } from "../shared/catalog";

export type Portrait = { kind: "standin" } | { kind: "captured"; dataUrl: string };
export type Slot = Exclude<Piece["slot"], "extras">;

export interface OwnedPiece {
  name: string;
  image: string;
  slot: Slot | null;
}

export interface MomentAnswers {
  occasion: OccasionId | null;
  venue: string | null;
  time: TimeId | null;
  vibe: VibeId | null;
  spend: SpendId | null;
  /** null until asked, "none" when he declines, otherwise his piece. */
  piece: OwnedPiece | "none" | null;
}

export interface DnaAnswers {
  fit: FitId | null;
  lifestyle: LifestyleId | null;
  presetIds: string[];
}

export interface Journey {
  portrait: Portrait | null;
  moment: MomentAnswers;
  dna: DnaAnswers;
}

const EMPTY_MOMENT: MomentAnswers = { occasion: null, venue: null, time: null, vibe: null, spend: null, piece: null };
const EMPTY_DNA: DnaAnswers = { fit: null, lifestyle: null, presetIds: [] };
const EMPTY: Journey = { portrait: null, moment: EMPTY_MOMENT, dna: EMPTY_DNA };
const KEY = "praxis_lab_c_session";

function read(): Journey {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Journey>;
    return {
      portrait: parsed.portrait ?? null,
      moment: { ...EMPTY_MOMENT, ...(parsed.moment ?? {}) },
      dna: { ...EMPTY_DNA, ...(parsed.dna ?? {}) },
    };
  } catch {
    return EMPTY;
  }
}

function write(journey: Journey): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(journey));
  } catch {
    // Storage full or unavailable; the session still works in memory.
  }
}

export function useJourney() {
  const [journey, setJourney] = useState<Journey>(read);

  useEffect(() => {
    write(journey);
  }, [journey]);

  const setPortrait = useCallback((portrait: Portrait | null) => {
    setJourney((j) => ({ ...j, portrait }));
  }, []);

  const answerMoment = useCallback(<K extends keyof MomentAnswers>(key: K, value: MomentAnswers[K]) => {
    setJourney((j) => {
      const moment = { ...j.moment, [key]: value };
      // Venues depend on the occasion, so a new occasion clears the venue.
      if (key === "occasion" && value !== j.moment.occasion) moment.venue = null;
      return { ...j, moment };
    });
  }, []);

  const answerDna = useCallback(<K extends keyof DnaAnswers>(key: K, value: DnaAnswers[K]) => {
    setJourney((j) => ({ ...j, dna: { ...j.dna, [key]: value } }));
  }, []);

  const setMoment = useCallback((moment: MomentAnswers) => {
    setJourney((j) => ({ ...j, moment }));
  }, []);

  const resetMoment = useCallback(() => {
    setJourney((j) => ({ ...j, moment: EMPTY_MOMENT }));
  }, []);

  const resetDna = useCallback(() => {
    setJourney((j) => ({ ...j, dna: EMPTY_DNA }));
  }, []);

  const clearAll = useCallback(() => {
    setJourney(EMPTY);
  }, []);

  return useMemo(
    () => ({ journey, setPortrait, answerMoment, setMoment, answerDna, resetMoment, resetDna, clearAll }),
    [journey, setPortrait, answerMoment, setMoment, answerDna, resetMoment, resetDna, clearAll],
  );
}

export type JourneyApi = ReturnType<typeof useJourney>;
