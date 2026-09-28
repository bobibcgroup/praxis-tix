import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import type { ChoiceOption } from "../shared/catalog";

interface DialProps {
  /** Accessible name of the group: the question. */
  label: string;
  options: readonly ChoiceOption[];
  selected: readonly string[];
  onSelect: (id: string) => void;
  /** Multi-select turns radios into toggles (used for inspiration). */
  multi?: boolean;
  /** Reports the chip currently in focus so the rail can show its hint. */
  onFocusChange?: (id: string | null) => void;
}

const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;
const DESKTOP = "(min-width: 1024px)";

function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    const query = window.matchMedia(DESKTOP);
    const onChange = (event: MediaQueryListEvent) => setDesktop(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

/**
 * The dial. Below 1024 px it is a single row under the frame: drag to spin,
 * the nearest chip settles in the centre, tap to answer (reduced motion turns
 * it into a native scroller). Above 1024 px the rail has room, so the chips
 * wrap into rows and nothing is ever off screen. Arrow keys move along it.
 */
export default function Dial({ label, options, selected, onSelect, multi = false, onFocusChange }: DialProps) {
  const reduced = useReducedMotion();
  const desktop = useDesktop();
  const viewportRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const x = useMotionValue(0);
  const lastDragEnd = useRef(0);
  const [focus, setFocus] = useState(() => Math.max(0, options.findIndex((o) => selected.includes(o.id))));
  const [bounds, setBounds] = useState({ left: 0, right: 0 });
  const spinner = !desktop && !reduced;

  const targetFor = useCallback((i: number): number => {
    const viewport = viewportRef.current;
    const chip = chipRefs.current[i];
    if (!viewport || !chip) return 0;
    return viewport.clientWidth / 2 - (chip.offsetLeft + chip.offsetWidth / 2);
  }, []);

  const settle = useCallback(
    (i: number, immediate = false) => {
      if (desktop) return;
      const target = targetFor(i);
      if (reduced) {
        const viewport = viewportRef.current;
        if (viewport) viewport.scrollLeft = -target;
        return;
      }
      if (immediate) {
        x.set(target);
        return;
      }
      animate(x, target, SPRING);
    },
    [desktop, targetFor, reduced, x],
  );

  useLayoutEffect(() => {
    if (focus > options.length - 1) setFocus(0);
  }, [options, focus]);

  useLayoutEffect(() => {
    if (desktop) return;
    const measure = () => {
      setBounds({ left: targetFor(options.length - 1), right: targetFor(0) });
      settle(focus, true);
    };
    measure();
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
    // Re-measure when the option set or layout mode changes; focus is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, desktop, targetFor]);

  useEffect(() => {
    settle(focus);
  }, [focus, settle]);

  useEffect(() => {
    onFocusChange?.(options[focus]?.id ?? null);
  }, [focus, options, onFocusChange]);

  const nearest = useCallback(
    (projectedX: number): number => {
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      options.forEach((_, i) => {
        const distance = Math.abs(targetFor(i) - projectedX);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      return best;
    },
    [options, targetFor],
  );

  const onDragEnd = (_: unknown, info: PanInfo) => {
    lastDragEnd.current = performance.now();
    const next = nearest(x.get() + info.velocity.x * 0.12);
    if (next === focus) settle(next);
    else setFocus(next);
  };

  const choose = (i: number, id: string) => {
    if (performance.now() - lastDragEnd.current < 250) return;
    setFocus(i);
    onSelect(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    let next: number | null = null;
    if (step !== 0) next = Math.min(last, Math.max(0, focus + step));
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setFocus(next);
    chipRefs.current[next]?.focus({ preventScroll: true });
  };

  const chips = options.map((option, i) => {
    const isSelected = selected.includes(option.id);
    return (
      <motion.button
        key={option.id}
        ref={(el) => {
          chipRefs.current[i] = el;
        }}
        type="button"
        role={multi ? undefined : "radio"}
        aria-checked={multi ? undefined : isSelected}
        aria-pressed={multi ? isSelected : undefined}
        data-focus={i === focus}
        tabIndex={i === focus ? 0 : -1}
        className="c-chip"
        whileTap={reduced ? undefined : { scale: 0.97 }}
        onClick={() => choose(i, option.id)}
      >
        {option.label}
      </motion.button>
    );
  });

  const role = multi ? "group" : "radiogroup";

  if (desktop) {
    return (
      <div role={role} aria-label={label} className="c-dial-wrap" onKeyDown={onKeyDown}>
        {chips}
      </div>
    );
  }

  if (!spinner) {
    return (
      <div ref={viewportRef} role={role} aria-label={label} className="c-dial c-dial-scroll" onKeyDown={onKeyDown}>
        <div className="c-dial-track">{chips}</div>
      </div>
    );
  }

  return (
    <div ref={viewportRef} role={role} aria-label={label} className="c-dial" onKeyDown={onKeyDown}>
      <motion.div
        className="c-dial-track cursor-grab active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragConstraints={bounds}
        dragElastic={0.12}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        {chips}
      </motion.div>
    </div>
  );
}
