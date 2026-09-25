"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Drop at the end of a chat transcript to keep the newest message in view.
 * Scrolls its own sentinel into view on every render where `trigger` changed,
 * which works whether the scrolling container is this element's nearest
 * scrollable ancestor (a modal dialog) or the window itself.
 */
export function ChatAutoScrollAnchor({ trigger }: { trigger: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [trigger]);
  return <div ref={ref} />;
}

export function ChatBubble({ from, children }: { from: "dku" | "you"; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${from === "you" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:text-base ${
          from === "you" ? "bg-ink text-white" : "bg-paper-dim text-ink/85"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function ChatBubbleList({ messages }: { messages: { from: "dku" | "you"; text: string }[] }) {
  return (
    <>
      <AnimatePresence initial={false}>
        {messages.map((m, i) => (
          <ChatBubble key={i} from={m.from}>
            {m.text}
          </ChatBubble>
        ))}
      </AnimatePresence>
      <ChatAutoScrollAnchor trigger={messages.length} />
    </>
  );
}
