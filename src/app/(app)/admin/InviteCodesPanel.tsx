"use client";

import { useState } from "react";

type InviteCode = {
  id: string;
  netId: string;
  code: string;
  usedAt: string | null;
  usedBy: { firstName: string; lastName: string; email: string } | null;
  createdAt: string;
};

export function InviteCodesPanel({ initialCodes }: { initialCodes: InviteCode[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [netId, setNetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createCode = async () => {
    const trimmed = netId.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);

    const res = await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ netId: trimmed }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.error ?? "Couldn't create that invite code.");
    } else {
      setCodes((prev) => [{ ...body.code, usedBy: null }, ...prev]);
      setNetId("");
    }
    setCreating(false);
  };

  const revoke = async (id: string) => {
    if (!window.confirm("Revoke this invite code?")) return;
    const res = await fetch(`/api/admin/invite-codes/${id}`, { method: "DELETE" });
    if (res.ok) setCodes((prev) => prev.filter((c) => c.id !== id));
  };

  const copy = (code: InviteCode) => {
    navigator.clipboard?.writeText(code.code).catch(() => {});
    setCopiedId(code.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">NetID to invite</span>
          <input
            value={netId}
            onChange={(e) => setNetId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void createCode()}
            placeholder="jsmith123"
            className="focus-ring rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-ink placeholder:text-ink/30 focus:border-gold"
          />
        </label>
        <button
          onClick={() => void createCode()}
          disabled={creating || !netId.trim()}
          className="focus-ring rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold-bright disabled:opacity-50"
        >
          {creating ? "Generating…" : "Generate invite code"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      <div className="mt-8 space-y-2">
        {codes.length === 0 ? (
          <p className="text-sm text-ink/40">No invite codes yet.</p>
        ) : (
          codes.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-paper px-4 py-3"
            >
              <div>
                <span className="font-mono text-sm font-medium tracking-wide text-ink">{c.code}</span>
                <span className="ml-2 text-sm text-ink/60">→ {c.netId}</span>
              </div>

              {c.usedAt ? (
                <span className="text-xs text-ink/45">
                  Used by {c.usedBy ? `${c.usedBy.firstName} ${c.usedBy.lastName}` : "someone"}
                </span>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => copy(c)} className="focus-ring text-xs text-ink/60 hover:text-ink">
                    {copiedId === c.id ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={() => void revoke(c.id)} className="focus-ring text-xs text-danger/80 hover:text-danger">
                    Revoke
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
