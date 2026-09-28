import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useConceptFonts } from "../shared/fonts";
import { useLabStore } from "../shared/store";
import "./b.css";
import BriefPage from "./BriefPage";
import DnaPage from "./DnaPage";
import { BASE, type Captures } from "./model";

const FONTS = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400&display=swap";

/**
 * Concept B: Brief. One page where the brief writes itself as you tap and
 * the looks resolve beside it. Sub-routes: / (brief), /looks (drawer), /dna.
 */
export default function ConceptB() {
  useConceptFonts("b", FONTS);
  const store = useLabStore("b");
  const [captures, setCaptures] = useState<Captures>({});

  return (
    <div data-lab data-concept="b" className="min-h-[100dvh]">
      <Routes>
        <Route index element={<BriefPage store={store} captures={captures} setCaptures={setCaptures} />} />
        <Route path="looks" element={<BriefPage store={store} captures={captures} setCaptures={setCaptures} library />} />
        <Route path="dna" element={<DnaPage store={store} captures={captures} setCaptures={setCaptures} />} />
        <Route path="*" element={<Navigate to={BASE} replace />} />
      </Routes>
    </div>
  );
}
