"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, CalendarDays, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

export type BoardAnnouncement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  expiresAt: string;
  visible: boolean;
  up: number;
  down: number;
  myVote: number;
  author: { id: string; firstName: string; lastName: string };
  event: { id: string; title: string; startsAt: string } | null;
};
export type BoardEventOption = { id: string; title: string; startsAt: string };

export function AnnouncementBoard({
  currentUserId,
  isAdmin,
  events,
}: {
  currentUserId: string;
  isAdmin: boolean;
  events: BoardEventOption[];
}) {
  const t = useT("chat");
  const [items, setItems] = useState<BoardAnnouncement[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [composing, setComposing] = useState(false);

  const load = useCallback(() => {
    fetch("/api/announcements")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((d: { announcements: BoardAnnouncement[] }) => setItems(d.announcements))
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <section aria-labelledby="board-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
        <div>
          <h1 id="board-heading" className="font-display text-3xl">{t("boardTitle")}</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/60">{t("boardDescription")}</p>
        </div>
        {!composing ? <Button onClick={() => setComposing(true)}>{t("boardPost")}</Button> : null}
      </div>

      {composing ? (
        <Composer
          events={events}
          onCancel={() => setComposing(false)}
          onPosted={(a) => {
            setItems((prev) => [a, ...(prev ?? [])]);
            setComposing(false);
          }}
        />
      ) : null}

      {loadError && !items ? <p className="py-6 text-sm text-danger">{t("boardLoadError")}</p> : null}
      {items === null && !loadError ? <p className="py-6 text-sm text-ink/45">{t("loading")}</p> : null}
      {items && items.length === 0 ? <p className="py-6 text-sm text-ink/50">{t("boardEmpty")}</p> : null}

      {items && items.length > 0 ? (
        <ol className="divide-y divide-ink/12">
          {items.map((a) => (
            <AnnouncementRow
              key={a.id}
              a={a}
              currentUserId={currentUserId}
              canDelete={isAdmin || a.author.id === currentUserId}
              onChange={(next) => setItems((prev) => (prev ?? []).map((x) => (x.id === a.id ? next : x)))}
              onDelete={() => setItems((prev) => (prev ?? []).filter((x) => x.id !== a.id))}
            />
          ))}
        </ol>
      ) : null}

      <p className="mt-3 text-xs text-ink/45">{t("boardRules")}</p>
    </section>
  );
}

function AnnouncementRow({
  a,
  currentUserId,
  canDelete,
  onChange,
  onDelete,
}: {
  a: BoardAnnouncement;
  currentUserId: string;
  canDelete: boolean;
  onChange: (a: BoardAnnouncement) => void;
  onDelete: () => void;
}) {
  const t = useT("chat");
  const [expanded, setExpanded] = useState(false);
  const net = a.up - a.down;
  const long = a.body.length > 280;

  const vote = async (value: 1 | -1) => {
    const res = await fetch(`/api/announcements/${a.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }).catch(() => null);
    if (!res || !res.ok) return;
    const d = await res.json();
    onChange({ ...a, up: d.up, down: d.down, myVote: d.myVote, expiresAt: d.expiresAt, visible: d.visible });
  };

  const remove = async () => {
    if (!window.confirm(t("boardConfirmDelete"))) return;
    const res = await fetch(`/api/announcements/${a.id}`, { method: "DELETE" });
    if (res.ok) onDelete();
  };

  const posted = formatDistanceToNowStrict(new Date(a.createdAt), { addSuffix: true });
  const leaves = formatDistanceToNowStrict(new Date(a.expiresAt));

  return (
    <li className={`flex gap-4 py-4 ${a.visible ? "" : "opacity-50"}`}>
      <div className="flex w-8 shrink-0 flex-col items-center pt-0.5">
        <button onClick={() => vote(1)} aria-label={t("boardUpvote")} aria-pressed={a.myVote === 1}
          className={`focus-ring p-0.5 ${a.myVote === 1 ? "text-sprout-deep" : "text-ink/40 hover:text-ink"}`}>
          <ChevronUp className="h-5 w-5" />
        </button>
        <span className="font-mono text-sm tabular-nums">{net}</span>
        <button onClick={() => vote(-1)} aria-label={t("boardDownvote")} aria-pressed={a.myVote === -1}
          className={`focus-ring p-0.5 ${a.myVote === -1 ? "text-danger" : "text-ink/40 hover:text-ink"}`}>
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold leading-snug">{a.title}</h2>
        <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/80 ${long && !expanded ? "line-clamp-4" : ""}`}>{a.body}</p>
        {long ? (
          <button onClick={() => setExpanded((v) => !v)} className="focus-ring mt-1 text-xs text-ink/60 underline">
            {expanded ? t("boardLess") : t("boardMore")}
          </button>
        ) : null}
        {a.event ? (
          <Link href={`/events/${a.event.id}`} className="focus-ring mt-2 inline-flex items-center gap-1.5 border border-ink/15 px-2 py-1 text-xs hover:border-ink">
            <CalendarDays className="h-3.5 w-3.5" /> {a.event.title}
          </Link>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50">
          <span>{a.author.firstName} {a.author.lastName} · {posted}</span>
          <span title={new Date(a.expiresAt).toLocaleString()}>{t("boardLeavesIn", { time: leaves })}</span>
          {a.author.id !== currentUserId ? (
            <a href={`/chat/dm/${a.author.id}`} className="focus-ring inline-flex items-center gap-1 hover:text-ink">
              <MessageSquare className="h-3.5 w-3.5" /> {t("boardMessageAuthor")}
            </a>
          ) : null}
          {canDelete ? (
            <button onClick={remove} className="focus-ring inline-flex items-center gap-1 hover:text-danger">
              <Trash2 className="h-3.5 w-3.5" /> {t("boardDelete")}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function Composer({
  events,
  onCancel,
  onPosted,
}: {
  events: BoardEventOption[];
  onCancel: () => void;
  onPosted: (a: BoardAnnouncement) => void;
}) {
  const t = useT("chat");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const input = "focus-ring w-full rounded-sm border border-ink/20 bg-canvas px-3 py-2 text-sm placeholder:text-ink/35 focus:border-ink";

  const submit = async () => {
    setError(null);
    setSaving(true);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, eventId }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(d.error ?? t("boardPostFailed"));
    onPosted(d.announcement);
  };

  return (
    <div className="mt-4 border border-ink/15 bg-paper p-4">
      <div className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={t("boardTitlePlaceholder")} className={input} autoFocus />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={4000} placeholder={t("boardBodyPlaceholder")} className={input} />
        {events.length > 0 ? (
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={input}>
            <option value="">{t("boardNoEvent")}</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {new Date(ev.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {ev.title}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} disabled={saving}>{saving ? t("boardPosting") : t("boardSend")}</Button>
        <Button variant="secondary" onClick={onCancel}>{t("boardCancel")}</Button>
      </div>
    </div>
  );
}
