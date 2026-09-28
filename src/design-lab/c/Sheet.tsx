import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";

interface SheetProps {
  open: boolean;
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The detail sheet. Opaque charcoal, one hairline edge, springs up from the
 * bottom. Drag down, tap outside, Escape or Close dismiss it.
 */
export default function Sheet({ open, label, onClose, children }: SheetProps) {
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => panel.current?.focus({ preventScroll: true }), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 500) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <button key="scrim" type="button" aria-label="Close details" className="c-sheet-scrim" onClick={onClose} tabIndex={-1} />
          <motion.div
            key="sheet"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className="c-sheet outline-none"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={reduced ? { duration: 0.12 } : { type: "spring", stiffness: 300, damping: 32 }}
            drag={reduced ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            dragMomentum={false}
            onDragEnd={onDragEnd}
          >
            <div className="flex h-8 shrink-0 items-center justify-center" aria-hidden="true">
              <span className="h-1 w-9 rounded-full bg-[var(--edge-strong)]" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(16px,env(safe-area-inset-bottom))] lg:px-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
