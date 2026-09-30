"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Check, Loader2, MessageCircle, UserPlus, X } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { ActivityItem, Person } from "@/lib/friends";

type Tab = "updates" | "following" | "followers" | "find";
const TABS: Tab[] = ["updates", "following", "followers", "find"];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong");
  return data as T;
}

function Avatar({ name, online }: { name: string; online?: boolean }) {
  const initials = name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="relative shrink-0">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold/30 to-sprout/30 text-xs font-semibold text-ink">{initials}</div>
      {online ? <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper bg-sprout-deep" aria-hidden /> : null}
    </div>
  );
}

function PersonRow({
  person,
  onToggleFollow,
  onMessage,
  busy,
}: {
  person: Person;
  onToggleFollow: (p: Person) => void;
  onMessage: (p: Person) => void;
  busy: boolean;
}) {
  const t = useT("friends");
  return (
    <li className="flex items-center gap-3 py-2">
      <Avatar name={person.name} online={person.online} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{person.name}</p>
        <p className="flex flex-wrap gap-x-2 text-xs text-ink/45">
          {person.friend ? <span className="text-sprout-deep">{t("friend")}</span> : person.followsMe ? <span>{t("followsYou")}</span> : null}
          {person.online ? <span className="text-sprout-deep">{t("online")}</span> : null}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onMessage(person)}
        aria-label={t("message", { name: person.name })}
        className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/45 transition-colors hover:bg-paper-dim hover:text-ink"
      >
        <MessageCircle className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onToggleFollow(person)}
        aria-label={person.following ? t("unfollow", { name: person.name }) : t("followAria", { name: person.name })}
        className={`focus-ring inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          person.following ? "border border-ink/20 text-ink/70 hover:border-danger hover:text-danger" : "bg-ink text-white hover:bg-ink/85"
        }`}
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : person.following ? <Check className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
        {person.following ? t("followingBtn") : t("follow")}
      </button>
    </li>
  );
}

export function FriendsModal({ onClose, onSeen, initialTab = "updates" }: { onClose: () => void; onSeen: () => void; initialTab?: Tab }) {
  const t = useT("friends");
  const { locale } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [connections, setConnections] = useState<{ following: Person[]; followers: Person[] } | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchSeq = useRef(0);

  const loadConnections = useCallback(async () => {
    try {
      setConnections(await api("/api/friends"));
    } catch {
      setError(t("loadError"));
    }
  }, [t]);

  useEffect(() => {
    if (tab === "updates") {
      let cancelled = false;
      api<{ items: ActivityItem[] }>("/api/friends/activity")
        .then((d) => {
          if (cancelled) return;
          setActivity(d.items);
          // Opening the tab counts as seeing it.
          void fetch("/api/friends/seen", { method: "POST" }).then(onSeen);
        })
        .catch(() => !cancelled && setError(t("loadError")));
      return () => {
        cancelled = true;
      };
    }
    if (tab === "following" || tab === "followers") {
      let cancelled = false;
      api<{ following: Person[]; followers: Person[] }>("/api/friends")
        .then((d) => !cancelled && setConnections(d))
        .catch(() => !cancelled && setError(t("loadError")));
      return () => {
        cancelled = true;
      };
    }
    // onSeen/t are stable enough for a tab switch; refetching on their identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== "find") return;
    const q = query.trim();
    const mine = ++searchSeq.current;
    if (q.length < 2) return;
    const id = setTimeout(async () => {
      try {
        const d = await api<{ people: Person[] }>(`/api/friends/search?q=${encodeURIComponent(q)}`);
        if (mine === searchSeq.current) setResults(d.people);
      } catch {
        if (mine === searchSeq.current) setResults([]);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query, tab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleFollow = async (person: Person) => {
    setBusyId(person.id);
    setError(null);
    try {
      await api(`/api/friends/${person.id}`, { method: person.following ? "DELETE" : "POST" });
      const apply = (p: Person): Person => {
        if (p.id !== person.id) return p;
        const following = !person.following;
        return { ...p, following, friend: following && p.followsMe, online: following && p.followsMe ? p.online : false };
      };
      setResults((prev) => prev.map(apply));
      setConnections((prev) => (prev ? { following: prev.following.map(apply), followers: prev.followers.map(apply) } : prev));
      // Anything that changed who you follow changes the updates feed and the lists.
      setActivity(null);
      void loadConnections();
      onSeen();
    } catch {
      setError(t("actionError"));
    } finally {
      setBusyId(null);
    }
  };

  const message = async (person: Person) => {
    try {
      const d = await api<{ channel: { id: string } }>("/api/chat/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: person.id }),
      });
      onClose();
      router.push(`/chat?channel=${d.channel.id}`);
    } catch {
      setError(t("actionError"));
    }
  };

  const list = (people: Person[] | undefined, empty: string) =>
    people === undefined ? (
      <p className="py-6 text-center text-sm text-ink/40">…</p>
    ) : people.length === 0 ? (
      <p className="py-6 text-center text-sm text-ink/40">{empty}</p>
    ) : (
      <ul className="divide-y divide-ink/5">
        {people.map((p) => (
          <PersonRow key={p.id} person={p} onToggleFollow={toggleFollow} onMessage={message} busy={busyId === p.id} />
        ))}
      </ul>
    );

  const tabLabel: Record<Tab, string> = {
    updates: t("updates"),
    following: t("following"),
    followers: t("followers"),
    find: t("find"),
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-ink/10 bg-paper sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="font-display text-2xl">{t("title")}</h2>
          <button onClick={onClose} className="focus-ring rounded-full p-1.5 text-ink/50 hover:text-ink" aria-label={t("close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex gap-1 overflow-x-auto px-4 pb-3">
          {TABS.map((k) => (
            <button
              key={k}
              onClick={() => {
                setError(null);
                setTab(k);
              }}
              className={`focus-ring shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                tab === k ? "bg-ink text-white" : "text-ink/60 hover:bg-paper-dim hover:text-ink"
              }`}
            >
              {tabLabel[k]}
            </button>
          ))}
        </div>

        <div className="min-h-[14rem] flex-1 overflow-y-auto border-t border-ink/10 px-5 py-3">
          {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}

          {tab === "updates" ? (
            activity === null ? (
              <p className="py-6 text-center text-sm text-ink/40">…</p>
            ) : activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink/40">{t("noUpdates")}</p>
            ) : (
              <>
                <ul className="divide-y divide-ink/5">
                  {activity.map((a) => {
                    const text = t(`act_${a.kind}`, { name: a.name, subject: locale === "zh" && a.subjectZh ? a.subjectZh : a.subject });
                    return (
                      <li key={a.id} className="flex items-start gap-3 py-2.5">
                        <Avatar name={a.name} />
                        <div className="min-w-0 flex-1">
                          {a.href ? (
                            <Link href={a.href} onClick={onClose} className="focus-ring rounded text-sm text-ink/85 hover:underline">
                              {text}
                            </Link>
                          ) : (
                            <p className="text-sm text-ink/85">{text}</p>
                          )}
                          <p className="text-xs text-ink/40">{formatDistanceToNow(new Date(a.at), { addSuffix: true })}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-center text-[11px] text-ink/35">{t("activityHint")}</p>
              </>
            )
          ) : null}

          {tab === "following" ? list(connections?.following, t("noFollowing")) : null}
          {tab === "followers" ? list(connections?.followers, t("noFollowers")) : null}

          {tab === "find" ? (
            <div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                autoFocus
                className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base text-ink placeholder:text-ink/35 focus:border-gold focus:outline-none sm:text-sm"
              />
              {query.trim().length < 2 ? (
                <p className="py-6 text-center text-sm text-ink/40">{t("typeToSearch")}</p>
              ) : (
                list(results, t("noResults"))
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
