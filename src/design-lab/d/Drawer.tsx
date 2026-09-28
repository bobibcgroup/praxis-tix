import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The right-edge drawer. Opening it never changes the page behind.
 * Escape closes it; the close control takes focus on open and focus returns after.
 */
export function Drawer({ open, title, onClose, children }: Props) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const returnRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnRef.current = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      returnRef.current?.focus?.();
    };
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
            initial={reduced ? { opacity: 0 } : { x: "100%" }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="d-drawer fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--rule)] bg-[var(--bg)] sm:w-[440px]"
          >
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--rule)] pl-5 pr-3 lg:pl-8 lg:pr-6">
              <h2 className="d-display text-[24px] leading-none lg:text-[24px]">{title}</h2>
              <button ref={closeRef} type="button" onClick={onClose} className="d-control d-tertiary text-[13px]">
                Close
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-8">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
