"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Megaphone,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useT } from "@/lib/i18n/client";

export type BoardAnnouncement = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
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

/** How many of the top-ranked posts rotate through the spotlight. */
const SPOTLIGHT_COUNT = 5;
const SPOTLIGHT_MS = 6500;

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const update = (next: BoardAnnouncement) => setItems((prev) => (prev ?? []).map((x) => (x.id === next.id ? next : x)));
  const spotlight = (items ?? []).filter((a) => a.visible).slice(0, SPOTLIGHT_COUNT);

  const openPost = (id: string) => {
    setExpandedId(id);
    document.getElementById(`post-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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

      {spotlight.length > 0 ? <Spotlight items={spotlight} onOpen={openPost} /> : null}

      {items && items.length > 0 ? (
        <>
          <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">{t("boardAllPosts")}</h2>
          <ol className="mt-2 divide-y divide-ink/12 border-y border-ink/12">
            {items.map((a) => (
              <AnnouncementRow
                key={a.id}
                a={a}
                currentUserId={currentUserId}
                canDelete={isAdmin || a.author.id === currentUserId}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId((cur) => (cur === a.id ? null : a.id))}
                onChange={update}
                onDelete={() => setItems((prev) => (prev ?? []).filter((x) => x.id !== a.id))}
              />
            ))}
          </ol>
        </>
      ) : null}

      <p className="mt-3 text-xs text-ink/45">{t("boardRules")}</p>
    </section>
  );
}

/** Top-ranked posts sliding right-to-left on a timer. Pauses on hover/focus and for reduced motion. */
function Spotlight({ items, onOpen }: { items: BoardAnnouncement[]; onOpen: (id: string) => void }) {
  const t = useT("chat");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = items.length;
  const current = Math.min(index, count - 1);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), SPOTLIGHT_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  return (
    <div
      className="relative mt-5 overflow-hidden border border-ink/15 bg-paper"
      role="region"
      aria-roledescription="carousel"
      aria-label={t("boardSpotlight")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(.22,.8,.25,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {items.map((a, i) => (
          <SpotlightSlide key={a.id} a={a} hidden={i !== current} label={t("boardSlideOf", { n: i + 1, total: count })} onOpen={() => onOpen(a.id)} />
        ))}
      </div>

      {count > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-ink/12 px-4 py-2.5">
          <div className="flex gap-1.5">
            {items.map((a, i) => (
              <button
                key={a.id}
                onClick={() => go(i)}
                aria-label={t("boardSlideOf", { n: i + 1, total: count })}
                aria-current={i === current}
                className={`focus-ring h-1.5 transition-all ${i === current ? "w-6 bg-ink" : "w-3 bg-ink/20 hover:bg-ink/40"}`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={() => go(current - 1)} aria-label={t("boardPrev")} className="focus-ring grid h-8 w-8 place-items-center border border-ink/15 text-ink/70 hover:border-ink hover:text-ink">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => go(current + 1)} aria-label={t("boardNext")} className="focus-ring grid h-8 w-8 place-items-center border border-ink/15 text-ink/70 hover:border-ink hover:text-ink">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SpotlightSlide({ a, hidden, label, onOpen }: { a: BoardAnnouncement; hidden: boolean; label: string; onOpen: () => void }) {
  const t = useT("chat");
  const net = a.up - a.down;
  const eventDate = a.event ? new Date(a.event.startsAt) : null;

  return (
    <article
      className="grid w-full shrink-0 grid-cols-1 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
      aria-hidden={hidden}
      aria-roledescription="slide"
      aria-label={label}
      inert={hidden}
    >
      <div className="relative aspect-[16/10] bg-ink sm:aspect-auto sm:min-h-[260px]">
        {a.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : eventDate ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-paper">
            <span className="text-xs uppercase tracking-[0.2em] text-gold-bright">
              {eventDate.toLocaleDateString(undefined, { month: "short" })}
            </span>
            <span className="font-display text-7xl leading-none">{eventDate.getDate()}</span>
            <span className="mt-1 text-xs text-paper/60">{eventDate.toLocaleDateString(undefined, { weekday: "long" })}</span>
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-gold-bright">
            <Megaphone className="h-14 w-14" strokeWidth={1.25} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">{t("boardSpotlight")}</p>
        <h3 className="mt-2 font-display text-2xl leading-tight sm:text-[1.7rem]">{a.title}</h3>
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{a.body}</p>
        {a.event ? (
          <Link href={`/events/${a.event.id}`} tabIndex={hidden ? -1 : undefined} className="focus-ring mt-3 inline-flex w-fit items-center gap-1.5 border border-ink/15 px-2 py-1 text-xs hover:border-ink">
            <CalendarDays className="h-3.5 w-3.5" /> {a.event.title}
          </Link>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-xs text-ink/55">
          <span>{a.author.firstName} {a.author.lastName} · {formatDistanceToNowStrict(new Date(a.createdAt), { addSuffix: true })}</span>
          <span className="inline-flex items-center gap-0.5 font-mono tabular-nums">
            <ChevronUp className="h-3.5 w-3.5" /> {net}
          </span>
          <button onClick={onOpen} tabIndex={hidden ? -1 : undefined} className="focus-ring ml-auto font-medium text-ink underline underline-offset-4 hover:text-gold">
            {t("boardReadPost")}
          </button>
        </div>
      </div>
    </article>
  );
}

function AnnouncementRow({
  a,
  currentUserId,
  canDelete,
  expanded,
  onToggle,
  onChange,
  onDelete,
}: {
  a: BoardAnnouncement;
  currentUserId: string;
  canDelete: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChange: (a: BoardAnnouncement) => void;
  onDelete: () => void;
}) {
  const t = useT("chat");
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
    <li id={`post-${a.id}`} className={`flex scroll-mt-24 gap-4 py-4 ${a.visible ? "" : "opacity-50"}`}>
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
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-snug">{a.title}</h3>
            <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/80 ${long && !expanded ? "line-clamp-4" : ""}`}>{a.body}</p>
            {long ? (
              <button onClick={onToggle} className="focus-ring mt-1 text-xs text-ink/60 underline">
                {expanded ? t("boardLess") : t("boardMore")}
              </button>
            ) : null}
          </div>
          {a.imageUrl && !expanded ? (
            <button onClick={onToggle} aria-label={t("boardViewPhoto")} className="focus-ring h-20 w-24 shrink-0 overflow-hidden border border-ink/12 bg-paper-dim sm:h-24 sm:w-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.imageUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ) : null}
        </div>
        {a.imageUrl && expanded ? (
          <button onClick={onToggle} aria-label={t("boardHidePhoto")} className="focus-ring mt-3 block w-full border border-ink/12 bg-paper-dim">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.imageUrl} alt="" className="max-h-[480px] w-full object-contain" />
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
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const input = "focus-ring w-full rounded-sm border border-ink/20 bg-canvas px-3 py-2 text-sm placeholder:text-ink/35 focus:border-ink";

  const submit = async () => {
    setError(null);
    setSaving(true);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, eventId, imageUrl }),
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
        <ImageUpload label={t("boardPhotoLabel")} value={imageUrl} onChange={setImageUrl} />
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} disabled={saving}>{saving ? t("boardPosting") : t("boardSend")}</Button>
        <Button variant="secondary" onClick={onCancel}>{t("boardCancel")}</Button>
      </div>
    </div>
  );
}
