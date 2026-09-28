import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useRef, type ReactNode } from "react";
import { Chevron } from "./ui";

interface Props {
  id: string;
  label: string;
  /** The chosen value. Null shows the placeholder in muted, which is the point: the plan is visible. */
  value: string | null;
  placeholder?: string;
  note?: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

/**
 * One line of the brief on the 96 / 1fr / 24 grid, 52 px tall. The row is a
 * button that expands its options in place; choosing collapses the line.
 * When the body has to scroll, an opened line brings its options fully into
 * view without pushing its own row off the top.
 */
export function BriefLine({ id, label, value, placeholder = "Choose", note, open, onToggle, children }: Props) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

  const reveal = useCallback(() => {
    const wrap = wrapRef.current;
    const body = wrap?.closest<HTMLElement>(".d-body");
    if (!wrap || !body || body.scrollHeight <= body.clientHeight) return;
    const line = wrap.getBoundingClientRect();
    const port = body.getBoundingClientRect();
    const below = line.bottom - port.bottom;
    if (below <= 0) return;
    const delta = Math.min(below, Math.max(0, line.top - port.top));
    body.scrollTo({ top: body.scrollTop + delta, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  return (
    <div ref={wrapRef}>
      <button type="button" id={`line-${id}`} aria-expanded={open} aria-controls={`panel-${id}`} onClick={onToggle} className="d-line">
        <span className="label">{label}</span>
        <span className={value ? "value" : "value empty"}>
          {value ?? placeholder}
          {value && note ? <span className="note">{note}</span> : null}
        </span>
        <Chevron />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            id={`panel-${id}`}
            role="region"
            aria-labelledby={`line-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            onAnimationComplete={reveal}
            className="overflow-hidden"
          >
            <div className="d-line-open">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
