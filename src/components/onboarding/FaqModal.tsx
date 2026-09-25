"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LoginModal } from "@/components/layout/LoginModal";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is DKU Life?",
    a: "A single place for the scattered, disparate bits of DKU info — events, food, campus news, and more — brought together so campus life feels unified and easy to navigate.",
  },
  {
    q: "Do I need an account to use it?",
    a: "No — you can look around as a guest. Creating an account (with your DKU netID) unlocks posting, RSVPing, ordering, and saving your own dashboard layout.",
  },
  {
    q: "How do dashboard widgets work?",
    a: "On the Home tab, hit \"Edit widgets\" to add, remove, and rearrange the tiles you see — then hit \"Done\" to save the layout to your account.",
  },
  {
    q: "Can I take the tour again?",
    a: "Yes — open this same \"?\" menu any time and choose \"Take the tour again.\"",
  },
];

export function FaqModal({ onClose }: { onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <LoginModal labelledBy="faq-modal-title" className="sm:max-w-lg" onDismiss={onClose}>
      <h2 id="faq-modal-title" className="font-display text-2xl text-ink">
        Common questions
      </h2>
      <div className="mt-5 space-y-2">
        {FAQ.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className="rounded-xl border border-ink/10">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="focus-ring flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-ink"
              >
                {item.q}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open ? <p className="px-4 pb-3 text-sm text-ink/65">{item.a}</p> : null}
            </div>
          );
        })}
      </div>
    </LoginModal>
  );
}
