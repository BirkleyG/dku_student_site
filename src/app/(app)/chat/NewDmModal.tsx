"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

type FoundUser = { id: string; firstName: string; lastName: string };

export function NewDmModal({
  onClose,
  onSelected,
}: {
  onClose: () => void;
  onSelected: (user: FoundUser) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setResults(data.users ?? []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

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
          <h2 className="font-display text-xl">New message</h2>
          <button onClick={onClose} className="focus-ring rounded-full p-1.5 text-ink/50 hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-ink/50">Look someone up by name to message them directly.</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          autoFocus
          className="focus-ring mt-4 w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-ink placeholder:text-ink/30 focus:border-gold"
        />
        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {loading ? <p className="px-1 py-2 text-sm text-ink/40">Searching…</p> : null}
          {!loading && query.trim().length >= 2 && results.length === 0 ? (
            <p className="px-1 py-2 text-sm text-ink/40">No one found.</p>
          ) : null}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelected(u)}
              className="focus-ring block w-full rounded-xl px-3 py-2 text-left text-sm text-ink/80 hover:bg-paper-dim"
            >
              {u.firstName} {u.lastName}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
