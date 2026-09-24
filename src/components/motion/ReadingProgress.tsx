"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A thin bar, fixed just under the sticky header (using the same
 * `--header-h` variable NavBar keeps accurate), that fills left-to-right
 * with page scroll progress. `useScroll` (no `target`) tracks the whole
 * document, and a spring smooths the raw progress so it doesn't feel
 * mechanical. `transform: scaleX` only — never a width tween — to stay off
 * the layout thread. Fixed (not sticky) so it spans the full viewport width
 * regardless of where in the page's container it's mounted.
 */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 280, damping: 40, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 z-20 h-[2px] origin-left bg-gold-bright"
      style={{ top: "var(--header-h)", scaleX }}
    />
  );
}
