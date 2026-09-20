"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LinkButton } from "@/components/ui/Button";

const lines = [
  "Hey — welcome to DKU Life.",
  "Duke Kunshan runs on a dozen scattered group chats, sign-up sheets, and forwarded emails.",
  "This is the one place instead: events, food, news, and the stuff only seniors know.",
  "Ready to look around?",
];

export function Welcome() {
  const [step, setStep] = useState(0);
  const done = step >= lines.length;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 500 : 1100);
    return () => clearTimeout(t);
  }, [step, done]);

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-white px-6">
      <BackgroundGlow />

      <div className="relative z-10 w-full max-w-xl">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.4em] text-gold-bright">Duke Kunshan University</p>

        <div className="min-h-[220px] space-y-4">
          <AnimatePresence>
            {lines.slice(0, step).map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={
                  i === lines.length - 1
                    ? "font-display text-3xl italic text-ink sm:text-4xl"
                    : "font-display text-2xl text-ink/60 sm:text-3xl"
                }
              >
                {line}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <LinkButton href="/signup">Set up my account</LinkButton>
              <LinkButton href="/home" variant="secondary">
                Just let me explore
              </LinkButton>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-sprout/40 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-20 h-[26rem] w-[26rem] rounded-full bg-gold/25 blur-[120px]"
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-1/3 top-1/4 h-64 w-64 rounded-full bg-sprout-deep/20 blur-[100px]"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
