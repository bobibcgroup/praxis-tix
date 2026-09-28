import { useMemo } from "react";
import { useReducedMotion } from "motion/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { STAND_IN_PORTRAIT } from "../shared/catalog";
import { useConceptFonts } from "../shared/fonts";
import { useLabStore } from "../shared/store";
import "./c.css";
import { LabContext, baseFromPathname, type LabContextValue } from "./context";
import Dna from "./Dna";
import { useJourney } from "./journey";
import Looks from "./Looks";
import Mirror from "./Mirror";
import You from "./You";

const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500&family=Manrope:wght@400;500&display=swap";

/**
 * Concept C: Mirror. One portrait frame on a dark stage; every question and
 * every look happens on it. Steps live in the URL under /__design/c.
 */
export default function ConceptC() {
  useConceptFonts("c", FONTS);
  const store = useLabStore("c");
  const journey = useJourney();
  const reduced = useReducedMotion();
  const { pathname } = useLocation();
  const base = useMemo(() => baseFromPathname(pathname), [pathname]);

  const portrait = journey.journey.portrait;
  const portraitSrc = portrait?.kind === "captured" ? portrait.dataUrl : (store.dna?.portrait ?? STAND_IN_PORTRAIT);
  const hasPortrait = portrait !== null || store.dna !== null;

  const value = useMemo<LabContextValue>(
    () => ({ store, journey, base, portraitSrc, hasPortrait, reduced: Boolean(reduced) }),
    [store, journey, base, portraitSrc, hasPortrait, reduced],
  );

  return (
    <LabContext.Provider value={value}>
      <div data-lab data-concept="c">
        <Routes>
          <Route path="looks/*" element={<Looks />} />
          <Route path="you" element={<You />} />
          <Route path="dna/*" element={<Dna />} />
          <Route path="*" element={<Mirror />} />
        </Routes>
      </div>
    </LabContext.Provider>
  );
}
