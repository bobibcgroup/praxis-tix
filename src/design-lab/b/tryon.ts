import { useEffect, useRef, useState } from "react";
import { TRYON_STAGES, useGuidedBuild, type GuidedBuildState } from "../shared/guided";

/**
 * Runs the try-on stages whenever `active` turns on and reports when the
 * rendering may be shown. Guards against the stale "done" of a previous run.
 */
export function useTryOn(active: boolean, reduced: boolean): { build: GuidedBuildState; rendered: boolean } {
  const [key, setKey] = useState(0);
  const [rendered, setRendered] = useState(false);
  const seenRunning = useRef(false);

  useEffect(() => {
    setRendered(false);
    seenRunning.current = false;
    if (active) setKey((k) => k + 1);
  }, [active]);

  const build = useGuidedBuild(TRYON_STAGES, active, key, reduced);

  useEffect(() => {
    if (!active) return;
    if (!build.done) {
      seenRunning.current = true;
      return;
    }
    if (seenRunning.current) setRendered(true);
  }, [active, build.done]);

  return { build, rendered };
}
