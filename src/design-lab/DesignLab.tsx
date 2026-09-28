import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import "./lab.css";
import LabIndex from "./LabIndex";

const ConceptA = lazy(() => import("./a/ConceptA"));
const ConceptB = lazy(() => import("./b/ConceptB"));
const ConceptC = lazy(() => import("./c/ConceptC"));
const ConceptD = lazy(() => import("./d/ConceptD"));
const SystemLab = lazy(() => import("./system/SystemLab"));

function Loading() {
  return <div data-lab className="flex min-h-[100dvh] items-center justify-center text-sm text-[#6b7280]">Opening</div>;
}

/**
 * Isolated design lab. Mounted under /__design only when the lab flag is on
 * (development, or VITE_DESIGN_LAB=1). Never linked from production UI.
 */
export default function DesignLab() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route index element={<LabIndex />} />
        <Route path="a/*" element={<ConceptA />} />
        <Route path="b/*" element={<ConceptB />} />
        <Route path="c/*" element={<ConceptC />} />
        <Route path="d/*" element={<ConceptD />} />
        <Route path="system" element={<SystemLab />} />
      </Routes>
    </Suspense>
  );
}
