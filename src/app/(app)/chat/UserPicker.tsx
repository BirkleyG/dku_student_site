"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export type PickedUser = { id: string; firstName: string; lastName: string };

/** Name search that builds up a list of selected people. `excludeIds` hides people already in the group. */
export function UserPicker({
  selected,
  onChange,
  excludeIds = [],
}: {
  selected: PickedUser[];
  onChange: (users: PickedUser[]) => void;
  excludeIds?: string[];
}) {
  const t = useT("chat");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedUser[]>([]);
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
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const hidden = new Set([...excludeIds, ...selected.map((u) => u.id)]);
  const visible = results.filter((u) => !hidden.has(u.id));

  return (
    <div>
      {selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <span key={u.id} className="inline-flex items-center gap-1 rounded-full bg-gold/15 py-1 pl-2.5 pr-1.5 text-xs text-ink">
              {u.firstName} {u.lastName}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s.id !== u.id))}
                className="focus-ring rounded-full text-ink/50 hover:text-ink"
                aria-label={t("removePersonAria", { name: `${u.firstName} ${u.lastName}` })}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchByNamePlaceholder")}
        className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-ink placeholder:text-ink/30 focus:border-gold"
      />
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
        {loading ? <p className="px-1 py-1 text-sm text-ink/40">{t("searching")}</p> : null}
        {!loading && query.trim().length >= 2 && visible.length === 0 ? (
          <p className="px-1 py-1 text-sm text-ink/40">{t("noOneFound")}</p>
        ) : null}
        {visible.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => {
              onChange([...selected, u]);
              setQuery("");
              setResults([]);
            }}
            className="focus-ring block w-full rounded-xl px-3 py-2 text-left text-sm text-ink/80 hover:bg-paper-dim"
          >
            {u.firstName} {u.lastName}
          </button>
        ))}
      </div>
    </div>
  );
}
