"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalCloseContextValue = {
  /** Starts the close animation, then (once it finishes) navigates back and runs `onClosed`. */
  requestClose: (onClosed?: () => void) => void;
};

const ModalCloseContext = createContext<ModalCloseContextValue | null>(null);

/** Lets content rendered inside `LoginModal` (e.g. the form's success handler) close it. */
export function useModalClose() {
  const ctx = useContext(ModalCloseContext);
  if (!ctx) throw new Error("useModalClose must be used within a LoginModal");
  return ctx;
}

/**
 * The intercepted `/login` route renders this shell: a centered card on desktop / bottom
 * sheet on mobile, over a dimmed + blurred backdrop. Closing (backdrop click, Esc, the ✕
 * button, or a successful login) animates out, then calls `router.back()` so the URL and
 * history stay in sync with the underlying page.
 */
export function LoginModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onClosedRef = useRef<(() => void) | undefined>(undefined);

  const requestClose = useCallback((onClosed?: () => void) => {
    onClosedRef.current = onClosed;
    setOpen(false);
  }, []);

  const handleExitComplete = useCallback(() => {
    router.back();
    onClosedRef.current?.();
    onClosedRef.current = undefined;
  }, [router]);

  // Lock body scroll while the modal is mounted.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Autofocus the email field (the dialog's first input) on open.
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("input")?.focus();
  }, []);

  // Esc to close, and trap Tab within the dialog.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  return (
    <ModalCloseContext.Provider value={{ requestClose }}>
      <AnimatePresence onExitComplete={handleExitComplete}>
        {open && (
          <div className="fixed inset-0 z-50">
            <motion.div
              aria-hidden
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => requestClose()}
            />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-6">
              <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-modal-title"
                className="relative w-full max-w-md rounded-t-3xl bg-white px-6 py-8 shadow-2xl sm:rounded-3xl sm:px-8 sm:py-10"
                initial={{ opacity: 0, y: 32, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 32, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <button
                  type="button"
                  onClick={() => requestClose()}
                  aria-label="Close"
                  className="focus-ring absolute right-4 top-4 rounded-full p-1.5 text-ink/50 transition-colors hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
                {children}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </ModalCloseContext.Provider>
  );
}
