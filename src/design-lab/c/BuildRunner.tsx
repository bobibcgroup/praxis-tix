import { useEffect } from "react";
import { useReducedMotion } from "motion/react";
import { useGuidedBuild, type BuildStage } from "../shared/guided";

interface BuildRunnerProps {
  stages: readonly BuildStage[];
  onProgress: (progress: number, label: string | null) => void;
  onDone: () => void;
}

/**
 * Runs one guided build from mount. Mount it with a fresh key per run so the
 * sequence always starts at zero, and unmount it when the run is over.
 */
export default function BuildRunner({ stages, onProgress, onDone }: BuildRunnerProps) {
  const reduced = useReducedMotion();
  const { progress, done, current } = useGuidedBuild(stages, true, 0, Boolean(reduced));
  const label = current?.label ?? null;

  useEffect(() => {
    onProgress(progress, label);
  }, [progress, label, onProgress]);

  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);

  return null;
}
