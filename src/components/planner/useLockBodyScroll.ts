import { useEffect } from "react";

/** Lock <body> scroll while a modal is mounted, so scrolling inside the
 * modal's own content doesn't also scroll the page behind it. */
export function useLockBodyScroll() {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);
}
