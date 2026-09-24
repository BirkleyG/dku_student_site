"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { DKU_COURSE_CATALOG, type CatalogCourse } from "@/lib/course-catalog";

/** Typeahead over the official DKU course catalog — pick one and the rest of the form fills itself in. */
export function CatalogPicker({ onPick }: { onPick: (course: CatalogCourse) => void }) {
  const [q, setQ] = useState("");

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    return DKU_COURSE_CATALOG.filter(
      (c) => c.code.toLowerCase().includes(query) || c.title.toLowerCase().includes(query),
    ).slice(0, 8);
  }, [q]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the official catalog — e.g. COMPSCI 201, or Data Structures"
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim py-3 pl-11 pr-10 text-ink placeholder:text-ink/30 focus:border-gold"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {matches.length > 0 ? (
        <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-lg">
          {matches.map((c) => (
            <button
              key={`${c.code}-${c.title}`}
              type="button"
              onClick={() => {
                onPick(c);
                setQ("");
              }}
              className="focus-ring flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-paper-dim"
            >
              <span className="shrink-0 rounded-full bg-sprout/25 px-2 py-0.5 text-xs font-medium text-sprout-deep">
                {c.code}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">{c.title}</span>
                <span className="block text-xs text-ink/40">
                  {c.department} · {c.credits} credits
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
