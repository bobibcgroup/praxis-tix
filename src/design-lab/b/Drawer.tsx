import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The right-edge drawer: a 1 px rule and a paper-tinted shadow, nothing else.
 * Escape closes it; the close control takes focus on open.
 */
export function Drawer({ open, title, onClose, children }: Props) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="scrim"
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 cursor-default bg-[var(--scrim)]"
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: reduced ? 0 : 0.28, ease: "easeOut" }}
            style={{ boxShadow: "var(--drawer-shadow)" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--rule)] bg-[var(--paper)] sm:w-[420px]"
          >
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--rule)] px-5">
              <h2 className="text-[15px] font-medium leading-none">{title}</h2>
              <button ref={closeRef} type="button" onClick={onClose} className="b-link text-[13px] transition-colors duration-150">
                Close
              </button>
            </header>
            <div className="b-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
