"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

type ChatGroup = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string | null;
  memberCount: number;
  createdAt: string;
};

export function ChatGroupsPanel({ initialGroups }: { initialGroups: ChatGroup[] }) {
  const t = useT("admin");
  const [groups, setGroups] = useState(initialGroups);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createGroup = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);

    const res = await fetch("/api/chat/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, description: description.trim() || undefined }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.error ?? t("chatGroupCreateError"));
    } else {
      setGroups((prev) => [{ ...body.channel, memberCount: 1 }, ...prev]);
      setName("");
      setDescription("");
    }
    setCreating(false);
  };

  const remove = async (id: string) => {
    if (!window.confirm(t("chatGroupDeleteConfirm"))) return;
    const res = await fetch(`/api/chat/channels/${id}`, { method: "DELETE" });
    if (res.ok) setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const copy = (group: ChatGroup) => {
    if (!group.inviteCode) return;
    navigator.clipboard?.writeText(group.inviteCode).catch(() => {});
    setCopiedId(group.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("chatGroupNameLabel")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("chatGroupNamePlaceholder")}
            className="focus-ring rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-ink placeholder:text-ink/30 focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("chatGroupDescriptionLabel")}</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("chatGroupDescriptionPlaceholder")}
            className="focus-ring w-64 rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-ink placeholder:text-ink/30 focus:border-gold"
          />
        </label>
        <button
          onClick={() => void createGroup()}
          disabled={creating || !name.trim()}
          className="focus-ring rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold-bright disabled:opacity-50"
        >
          {creating ? t("chatGroupCreating") : t("chatGroupCreateButton")}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      <div className="mt-8 space-y-2">
        {groups.length === 0 ? (
          <p className="text-sm text-ink/40">{t("noChatGroupsYet")}</p>
        ) : (
          groups.map((g) => (
            <div
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-paper px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{g.name}</p>
                <p className="truncate text-xs text-ink/45">
                  {g.memberCount === 1 ? t("chatGroupMemberOne", { n: g.memberCount }) : t("chatGroupMemberOther", { n: g.memberCount })}
                  {g.description ? ` · ${g.description}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium tracking-wide text-ink">{g.inviteCode}</span>
                <button onClick={() => copy(g)} className="focus-ring text-xs text-ink/60 hover:text-ink">
                  {copiedId === g.id ? t("copied") : t("copy")}
                </button>
                <button onClick={() => void remove(g.id)} className="focus-ring text-xs text-danger/80 hover:text-danger">
                  {t("chatGroupDeleteButton")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
