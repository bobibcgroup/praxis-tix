import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface RingProps {
  /** 0 to 1, the real progress from useGuidedBuild. */
  progress: number;
  active: boolean;
}

/** Distance from the frame edge; the radius follows so the ring traces the frame's own corner. */
const INSET = 3;
const FRAME_RADIUS = 20;

/** A 2 px accent stroke tracing the frame's rounded rectangle, filled by real progress. */
export default function Ring({ progress, active }: RingProps) {
  const reduced = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      setSize({ w: Math.round(box.width), h: Math.round(box.height) });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const geometry = {
    x: INSET,
    y: INSET,
    width: Math.max(0, size.w - 2 * INSET),
    height: Math.max(0, size.h - 2 * INSET),
    rx: FRAME_RADIUS - INSET,
    ry: FRAME_RADIUS - INSET,
  };

  return (
    <motion.svg
      ref={ref}
      aria-hidden="true"
      className="c-ring pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${Math.max(1, size.w)} ${Math.max(1, size.h)}`}
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: reduced ? 0.12 : 0.35 }}
    >
      {size.w > 0 && (
        <>
          <rect {...geometry} className="c-ring-track" pathLength={1} />
          <rect {...geometry} className="c-ring-fill" pathLength={1} strokeDasharray="1 1" style={{ strokeDashoffset: 1 - Math.min(1, Math.max(0, progress)) }} />
        </>
      )}
    </motion.svg>
  );
}
