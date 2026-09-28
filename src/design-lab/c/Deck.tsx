import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";

export interface DeckItem {
  id: string;
  image: string;
  alt: string;
}

interface DeckProps {
  items: readonly DeckItem[];
  index: number;
  onIndex: (i: number) => void;
  onOpen: (i: number) => void;
  openLabel: string;
  /** When set, the centre item crossfades in over this image on first render. */
  under?: string | null;
  note?: string | null;
  /** Accessible name of the whole deck. */
  label: string;
}

/**
 * Neighbours tuck under the current frame by this share of its width, so the
 * peek band shows the next look's shoulder rather than the photo's backdrop.
 */
const OVERLAP = 0.38;
const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

/**
 * The frame as a horizontal deck: the current look at full size, the
 * neighbours peeking at the edges. Drag to swipe, arrows or dots to step.
 */
export default function Deck({ items, index, onIndex, onOpen, openLabel, under, note, label }: DeckProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const lastDragEnd = useRef(0);
  const [layout, setLayout] = useState({ step: 0, peek: 20 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const peek = Number.parseFloat(getComputedStyle(el).getPropertyValue("--peek")) || 20;
      const frameWidth = el.clientWidth - 2 * peek;
      setLayout({ peek, step: Math.round(frameWidth * (1 - OVERLAP)) });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clamp = (i: number) => Math.min(items.length - 1, Math.max(0, i));

  const onDragEnd = (_: unknown, info: PanInfo) => {
    lastDragEnd.current = performance.now();
    const direction = info.offset.x < -60 || info.velocity.x < -400 ? 1 : info.offset.x > 60 || info.velocity.x > 400 ? -1 : 0;
    const next = clamp(index + direction);
    if (next !== index) onIndex(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") onIndex(clamp(index + 1));
    else if (event.key === "ArrowLeft") onIndex(clamp(index - 1));
    else return;
    event.preventDefault();
  };

  const open = (i: number) => {
    if (performance.now() - lastDragEnd.current < 250) return;
    if (i === index) onOpen(i);
    else onIndex(i);
  };

  return (
    <div ref={ref} className="c-deck relative overflow-hidden" aria-roledescription="carousel" aria-label={label} onKeyDown={onKeyDown}>
      <motion.div
        className="relative h-full w-full"
        drag={reduced ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
        style={{ x: dragX }}
        onDragEnd={onDragEnd}
      >
        {items.map((item, i) => {
          const current = i === index;
          return (
            <motion.div
              key={item.id}
              className="c-frame-size absolute top-0"
              style={{ left: layout.peek, zIndex: current ? 1 : 0 }}
              initial={false}
              animate={{ x: (i - index) * layout.step, scale: current ? 1 : 0.96, opacity: current ? 1 : 0.6 }}
              transition={reduced ? { duration: 0.12 } : SPRING}
              aria-hidden={!current}
            >
              <button
                type="button"
                tabIndex={current ? 0 : -1}
                aria-label={current ? `${openLabel}: ${item.alt}` : `Show ${item.alt}`}
                onClick={() => open(i)}
                className="relative block h-full w-full cursor-pointer overflow-hidden rounded-[20px] bg-[var(--sheet)]"
              >
                {current && under && <img src={under} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
                <motion.img
                  src={item.image}
                  alt={item.alt}
                  draggable={false}
                  className="absolute inset-0 h-full w-full select-none object-cover"
                  initial={current && under ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduced ? 0.12 : 0.6 }}
                />
                {current && note && (
                  <>
                    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%]" style={{ background: "linear-gradient(to top, rgba(20,21,22,0.82), rgba(20,21,22,0))" }} />
                    <span className="pointer-events-none absolute bottom-4 left-4 text-[14px] font-medium text-[var(--text)] opacity-85 lg:bottom-5 lg:left-5">{note}</span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
