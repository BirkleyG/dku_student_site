"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function JoinGroupModal({
  onClose,
  onJoined,
}: {
  onClose: () => void;
  onJoined: (channel: { id: string; name: string; description: string | null }) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const join = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/chat/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't join that group.");
      setSubmitting(false);
      return;
    }
    onJoined(data.channel);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full rounded-t-3xl border border-ink/10 bg-paper p-5 sm:max-w-sm sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Join a group</h2>
          <button onClick={onClose} className="focus-ring rounded-full p-1.5 text-ink/50 hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-ink/50">Enter the invite code someone shared with you.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void join()}
          placeholder="Invite code"
          autoFocus
          className="focus-ring mt-4 w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 font-mono uppercase tracking-widest text-ink placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/30 focus:border-gold"
        />
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <Button onClick={() => void join()} disabled={submitting || !code.trim()} className="mt-4 w-full">
          {submitting ? "Joining…" : "Join group"}
        </Button>
      </motion.div>
    </motion.div>
  );
}
