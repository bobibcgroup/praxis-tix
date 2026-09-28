import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

interface Props {
  open: boolean;
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * On mobile the looks arrive as a full-height sheet with a handle. The brief
 * stays one swipe below: drag the handle down or tap it to get back.
 */
export function MobileSheet({ open, label, onClose, children }: Props) {
  const reduced = useReducedMotion();
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const modalAbove = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (event.key === "Escape" && !modalAbove) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.section
          key="sheet"
          role="dialog"
          aria-label={label}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: reduced ? 0 : 0.28, ease: "easeOut" }}
          drag="y"
          dragControls={controls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 96 || info.velocity.y > 600) onClose();
          }}
          style={{ boxShadow: "0 -24px 24px -16px rgba(26, 27, 30, 0.1)" }}
          className="fixed inset-x-0 bottom-0 top-3 z-30 flex flex-col rounded-t-[6px] border border-b-0 border-[var(--rule)] bg-[var(--paper)]"
        >
          <div
            role="group"
            aria-label="Sheet handle"
            className="flex h-11 shrink-0 touch-none items-center justify-center"
            onPointerDown={(event) => controls.start(event)}
          >
            <button type="button" onClick={onClose} className="flex h-11 min-h-[44px] w-24 items-center justify-center">
              <span className="block h-1 w-9 rounded-full bg-[var(--rule)]" aria-hidden="true" />
              <span className="sr-only">Hide the looks. Drag down or press to return to the brief.</span>
            </button>
          </div>
          <div className="b-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-6">{children}</div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
