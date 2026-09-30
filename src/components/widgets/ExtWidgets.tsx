"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Send, Shuffle } from "lucide-react";
import { navItems } from "@/lib/nav";
import { widgetCatalog, type WidgetInstance } from "@/lib/widgets";
import type { WV, WvItem } from "@/lib/widget-types";
import { useT } from "@/lib/i18n/client";
import type { WidgetData } from "./AppWidgetContent";

const CTRL_INPUT =
  "w-full rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-sm text-ink placeholder:text-ink/35 focus:border-gold focus:outline-none";
const CTRL_BUTTON =
  "focus-ring inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-50";

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-ink/40">{label}</p>;
}

async function send(url: string, method: string, body?: unknown): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: (data as { error?: string } | null)?.error ?? "Something went wrong" };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

function Rows({ items, linked, empty }: { items: WvItem[]; linked: boolean; empty: string }) {
  if (!items.length) return <Empty label={empty} />;
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item) => {
        const body = (
          <>
            <span className="block truncate text-ink/80">{item.primary}</span>
            {item.secondary ? <span className="block truncate text-xs text-ink/40">{item.secondary}</span> : null}
          </>
        );
        return (
          <li key={item.id} className="min-w-0">
            {linked && item.href ? (
              <Link href={item.href} className="focus-ring block rounded-md hover:bg-paper-dim">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
      <div className="h-full rounded-full bg-gradient-to-r from-gold to-sprout" style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
    </div>
  );
}

function Ticker({ items, empty }: { items: WvItem[]; empty: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(id);
  }, [items.length]);
  if (!items.length) return <Empty label={empty} />;
  const item = items[index % items.length];
  return (
    <div>
      <div key={item.id}>
        <p className="line-clamp-3 text-sm font-medium text-ink">{item.primary}</p>
        {item.secondary ? <p className="mt-1 text-xs text-ink/40">{item.secondary}</p> : null}
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {items.map((it, i) => (
          <span key={it.id} className={`h-1 w-4 rounded-full ${i === index % items.length ? "bg-gold" : "bg-ink/10"}`} />
        ))}
      </div>
    </div>
  );
}

function ShuffleCard({ wv }: { wv: Extract<WV, { t: "shuffle" }> }) {
  const [index, setIndex] = useState(0);
  if (!wv.items.length) return <Empty label={wv.empty} />;
  const item = wv.items[index % wv.items.length];
  return (
    <div className="flex h-full flex-col">
      {item.kicker ? <p className="truncate text-xs text-ink/40">{item.kicker}</p> : null}
      {item.href ? (
        <Link href={item.href} className="focus-ring rounded-md hover:underline">
          <p className="line-clamp-2 text-sm font-medium text-ink">{item.title}</p>
        </Link>
      ) : (
        <p className="line-clamp-2 text-sm font-medium text-ink">{item.title}</p>
      )}
      {item.body ? <p className="mt-0.5 line-clamp-2 text-xs text-ink/60">{item.body}</p> : null}
      <button
        type="button"
        onClick={() => setIndex((i) => (wv.items.length > 1 ? (i + 1 + Math.floor(Math.random() * (wv.items.length - 1))) % wv.items.length : i))}
        className={`${CTRL_BUTTON} mt-auto w-fit`}
      >
        <Shuffle className="h-3.5 w-3.5" />
        {wv.cta}
      </button>
    </div>
  );
}

function PollCard({ wv }: { wv: Extract<WV, { t: "poll" }> }) {
  const t = useT("widgets");
  const [options, setOptions] = useState(wv.options);
  const [myVote, setMyVote] = useState(wv.myVote);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const total = options.reduce((s, o) => s + o.votes, 0);

  const vote = async (optionId: string) => {
    if (pending || optionId === myVote) return;
    setPending(true);
    setError(null);
    const res = await send(`/api/slb/polls/${wv.pollId}/vote`, "POST", { optionId });
    setPending(false);
    if (!res.ok) return setError(res.error);
    setOptions((prev) => prev.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o.id === myVote ? { ...o, votes: Math.max(0, o.votes - 1) } : o)));
    setMyVote(optionId);
  };

  return (
    <div>
      <p className="line-clamp-2 text-sm font-medium text-ink">{wv.question}</p>
      <div className="mt-2 space-y-1">
        {options.slice(0, 4).map((o) => {
          const pct = total ? Math.round((o.votes / total) * 100) : 0;
          const mine = o.id === myVote;
          return (
            <button
              key={o.id}
              type="button"
              disabled={!wv.loggedIn || pending}
              onClick={() => vote(o.id)}
              className={`focus-ring relative block w-full overflow-hidden rounded-lg border px-2.5 py-1 text-left text-xs transition-colors ${
                mine ? "border-gold" : "border-ink/15 hover:border-ink/35"
              }`}
            >
              <span className="absolute inset-y-0 left-0 bg-gold/15" style={{ width: `${pct}%` }} aria-hidden />
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1 truncate text-ink/80">
                  {mine ? <Check className="h-3 w-3 shrink-0 text-gold" /> : null}
                  <span className="truncate">{o.label}</span>
                </span>
                <span className="shrink-0 text-ink/45">{pct}%</span>
              </span>
            </button>
          );
        })}
      </div>
      {!wv.loggedIn ? <p className="mt-1 text-[11px] text-ink/40">{t("logInToVote")}</p> : null}
      {error ? <p className="mt-1 text-[11px] text-danger">{error}</p> : null}
    </div>
  );
}

function InitiativeCard({ wv }: { wv: Extract<WV, { t: "initiative" }> }) {
  const t = useT("widgets");
  const [backed, setBacked] = useState(wv.backed);
  const [backers, setBackers] = useState(wv.backers);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setPending(true);
    setError(null);
    const res = await send(`/api/slb/initiatives/${wv.id}/back`, backed ? "DELETE" : "POST");
    setPending(false);
    if (!res.ok) return setError(res.error);
    setBackers((n) => n + (backed ? -1 : 1));
    setBacked(!backed);
  };

  return (
    <div className="flex h-full flex-col">
      <Link href={`/slb/initiatives/${wv.id}`} className="focus-ring rounded-md hover:underline">
        <p className="line-clamp-2 text-sm font-medium text-ink">{wv.title}</p>
      </Link>
      <p className="mt-1 text-xs text-ink/45">{t(backers === 1 ? "backerOne" : "backerMany", { n: backers })}</p>
      {wv.canBack ? (
        <button type="button" onClick={toggle} disabled={pending} className={`${CTRL_BUTTON} mt-auto w-fit`}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : backed ? <Check className="h-3.5 w-3.5" /> : null}
          {backed ? t("backed") : t("back")}
        </button>
      ) : (
        <p className="mt-auto text-[11px] text-ink/40">{t("membersCanBack")}</p>
      )}
      {error ? <p className="mt-1 text-[11px] text-danger">{error}</p> : null}
    </div>
  );
}

function ChatComposer({ signedIn }: { signedIn: boolean }) {
  const t = useT("widgets");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) return <Empty label={t("logInToSee")} />;

  const submit = async () => {
    if (!body.trim() || state === "sending") return;
    setState("sending");
    setError(null);
    const res = await send("/api/chat/channels/general/messages", "POST", { body });
    if (!res.ok) {
      setState("idle");
      return setError(res.error);
    }
    setBody("");
    setState("sent");
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <div className="flex h-full flex-col gap-1.5">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        rows={2}
        placeholder={t("saySomething")}
        className={`${CTRL_INPUT} min-h-0 flex-1 resize-none`}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-danger">{error}</span>
        <button type="button" onClick={submit} disabled={!body.trim() || state === "sending"} className={CTRL_BUTTON}>
          {state === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === "sent" ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          {state === "sent" ? t("posted") : t("post")}
        </button>
      </div>
    </div>
  );
}

function DmLauncher({ signedIn }: { signedIn: boolean }) {
  const t = useT("widgets");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!signedIn) return;
    const query = q.trim();
    if (query.length < 2) {
      seq.current++;
      return;
    }
    const mine = ++seq.current;
    const id = setTimeout(async () => {
      const res = await send(`/api/users/search?q=${encodeURIComponent(query)}`, "GET");
      if (mine !== seq.current) return;
      setPeople(res.ok ? ((res.data as { users?: typeof people }).users ?? []) : []);
    }, 250);
    return () => clearTimeout(id);
  }, [q, signedIn]);

  if (!signedIn) return <Empty label={t("logInToSee")} />;

  const open = async (userId: string) => {
    setError(null);
    const res = await send("/api/chat/dm", "POST", { userId });
    if (!res.ok) return setError(res.error);
    router.push(`/chat?channel=${(res.data as { channel: { id: string } }).channel.id}`);
  };

  const shown = q.trim().length >= 2 ? people : [];
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("findSomeone")} className={CTRL_INPUT} />
      <ul className="mt-1.5 space-y-0.5">
        {shown.slice(0, 3).map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => open(p.id)} className="focus-ring block w-full truncate rounded-md px-1.5 py-1 text-left text-sm text-ink/80 hover:bg-paper-dim">
              {p.firstName} {p.lastName}
            </button>
          </li>
        ))}
      </ul>
      {error ? <p className="text-[11px] text-danger">{error}</p> : null}
    </div>
  );
}

function TipComposer({ wv, signedIn }: { wv: Extract<WV, { t: "tipComposer" }>; signedIn: boolean }) {
  const t = useT("widgets");
  const [topicId, setTopicId] = useState(wv.topics[0]?.id ?? "");
  const [placeName, setPlaceName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) return <Empty label={t("logInToSee")} />;
  if (!wv.topics.length) return <Empty label={t("noTopicsYet")} />;
  const topic = wv.topics.find((x) => x.id === topicId) ?? wv.topics[0];

  const submit = async () => {
    setState("sending");
    setError(null);
    const res = await send(`/api/wisdom/${topic.id}/recommendations`, "POST", { placeName, location, description });
    if (!res.ok) {
      setState("idle");
      return setError(res.error);
    }
    setPlaceName("");
    setLocation("");
    setDescription("");
    setState("sent");
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <div className="flex h-full flex-col gap-1.5">
      <select value={topic.id} onChange={(e) => setTopicId(e.target.value)} className={CTRL_INPUT} aria-label={t("topic")}>
        {wv.topics.map((x) => (
          <option key={x.id} value={x.id}>
            {x.title}
          </option>
        ))}
      </select>
      <input value={placeName} onChange={(e) => setPlaceName(e.target.value)} maxLength={140} placeholder={t("tipName")} className={CTRL_INPUT} />
      {topic.requireLocation ? (
        <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={300} placeholder={t("tipLocation")} className={CTRL_INPUT} />
      ) : null}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
        rows={2}
        placeholder={t("tipWhy")}
        className={`${CTRL_INPUT} min-h-0 flex-1 resize-none`}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-danger">{error}</span>
        <button type="button" onClick={submit} disabled={state === "sending" || placeName.trim().length < 2 || description.trim().length < 5} className={CTRL_BUTTON}>
          {state === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === "sent" ? <Check className="h-3.5 w-3.5" /> : null}
          {state === "sent" ? t("shared") : t("share")}
        </button>
      </div>
    </div>
  );
}

function CourseSearch() {
  const t = useT("widgets");
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/courses?q=${encodeURIComponent(q.trim())}` : "/courses");
      }}
    >
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("courseSearchPlaceholder")} className={CTRL_INPUT} />
      <button type="submit" className={`${CTRL_BUTTON} mt-2`}>
        {t("search")}
      </button>
    </form>
  );
}

function CurrencyConverter({ rates, currency }: { rates: Record<string, number> | null; currency: string }) {
  const t = useT("widgets");
  const [amount, setAmount] = useState("100");
  if (!rates) return <Empty label={t("ratesUnavailable")} />;
  const code = rates[currency] ? currency : (Object.keys(rates)[0] ?? "USD");
  const rate = rates[code];
  const value = Number.parseFloat(amount);
  const converted = Number.isFinite(value) ? value * rate : null;
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-ink/50">¥</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          aria-label={t("amountInYuan")}
          className={`${CTRL_INPUT} w-24`}
        />
        <span className="text-xs text-ink/40">CNY</span>
      </div>
      <p className="mt-2 font-display text-2xl leading-none text-ink">
        {converted === null ? "—" : converted.toLocaleString("en-US", { maximumFractionDigits: converted < 10 ? 2 : 0 })}
        <span className="ml-1 text-sm text-ink/45">{code}</span>
      </p>
      <p className="mt-1 text-[11px] text-ink/40">{t("rateLine", { rate: rate.toLocaleString("en-US", { maximumFractionDigits: 4 }), code })}</p>
    </div>
  );
}

function DualClock({ timeZone, nowIso }: { timeZone: string; nowIso: string }) {
  const t = useT("widgets");
  const [now, setNow] = useState(() => new Date(nowIso));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  const format = (tz: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(now);
    } catch {
      return "—";
    }
  };
  const label = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
  return (
    <div className="space-y-1.5">
      <div>
        <p className="font-display text-xl leading-none text-ink">{format("Asia/Shanghai")}</p>
        <p className="mt-0.5 text-[11px] text-ink/45">{t("kunshan")}</p>
      </div>
      <div>
        <p className="font-display text-xl leading-none text-ink/80">{format(timeZone)}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink/45">{label}</p>
      </div>
    </div>
  );
}

function QuickLinks({ hrefs }: { hrefs: string[] }) {
  const t = useT("nav");
  const items = hrefs.flatMap((h) => navItems.filter((n) => n.href === h));
  if (!items.length) return <Empty label={t("starHint")} />;
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {items.slice(0, 8).map((n) => {
        const Icon = n.icon;
        return (
          <Link key={n.href} href={n.href} className="focus-ring flex flex-col items-center gap-1 rounded-xl py-1.5 text-center hover:bg-paper-dim">
            <Icon className="h-4 w-4 text-ink/70" strokeWidth={1.75} />
            <span className="w-full truncate text-[11px] text-ink/60">{t(n.labelKey)}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function ExtWidget({ instance, data }: { instance: WidgetInstance; data: WidgetData }) {
  const t = useT("widgets");
  const meta = widgetCatalog[instance.kind];
  const linked = Boolean(meta.interactive);
  const wv: WV | undefined = data.ext[instance.kind];

  // Widgets that read from other data (Eats) or only from their own config.
  switch (instance.kind) {
    case "EATS_RANDOM":
      return <EatsRandom data={data} />;
    case "EATS_BUSY":
      return <EatsBusy data={data} />;
    case "EATS_LAST_ORDER":
      return data.eats.lastOrder ? (
        <div className="flex h-full flex-col">
          <p className="truncate text-sm font-medium text-ink">{data.eats.lastOrder.restaurant}</p>
          <p className="text-xs text-ink/50">
            {data.eats.lastOrder.status} · {data.eats.lastOrder.timeAgo}
          </p>
          <Link href="/eats" className={`${CTRL_BUTTON} mt-auto w-fit`}>
            {t("orderAgain")}
          </Link>
        </div>
      ) : (
        <Empty label={data.signedIn ? t("noOrdersYet") : t("logInToSee")} />
      );
    case "COURSES_SEARCH":
      return <CourseSearch />;
    case "CAMPUS_QUICK_LINKS":
      return <QuickLinks hrefs={Array.isArray(instance.config.hrefs) ? (instance.config.hrefs as string[]) : []} />;
    case "CAMPUS_DUAL_CLOCK":
      return <DualClock timeZone={typeof instance.config.timeZone === "string" ? instance.config.timeZone : "America/New_York"} nowIso={data.now} />;
    default:
      break;
  }

  if (!wv) return <Empty label={t("widgetUnavailable")} />;

  switch (wv.t) {
    case "empty":
      return <Empty label={wv.label} />;
    case "stat":
      return (
        <div>
          <p className="font-display text-3xl leading-none text-ink">{wv.value}</p>
          <p className="mt-1.5 line-clamp-2 text-xs text-ink/60">{wv.label}</p>
          {wv.sub ? <p className="mt-0.5 line-clamp-1 text-xs text-ink/40">{wv.sub}</p> : null}
        </div>
      );
    case "list":
      return <Rows items={wv.items} linked={linked} empty={wv.empty} />;
    case "spot":
      return (
        <div>
          {wv.kicker ? <p className="truncate text-xs text-ink/40">{wv.kicker}</p> : null}
          <p className="line-clamp-2 text-sm font-medium text-ink">{wv.title}</p>
          {wv.body ? <p className="mt-0.5 line-clamp-3 text-xs text-ink/60">{wv.body}</p> : null}
          {wv.foot ? <p className="mt-1 text-xs text-ink/40">{wv.foot}</p> : null}
        </div>
      );
    case "progress":
      return (
        <div>
          <p className="truncate font-display text-2xl leading-none text-ink">{wv.value}</p>
          <ProgressBar pct={wv.pct} />
          <p className="mt-1.5 line-clamp-2 text-xs text-ink/60">{wv.label}</p>
          {wv.sub ? <p className="mt-0.5 line-clamp-1 text-xs text-ink/40">{wv.sub}</p> : null}
        </div>
      );
    case "launch":
      return (
        <div>
          <p className="line-clamp-2 text-sm text-ink/70">{wv.text}</p>
          <span className="mt-1.5 inline-block rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">{wv.cta} →</span>
        </div>
      );
    case "ticker":
      return <Ticker items={wv.items} empty={wv.empty} />;
    case "shuffle":
      return <ShuffleCard wv={wv} />;
    case "poll":
      return <PollCard wv={wv} />;
    case "initiative":
      return <InitiativeCard wv={wv} />;
    case "chatComposer":
      return <ChatComposer signedIn={data.signedIn} />;
    case "dmLaunch":
      return <DmLauncher signedIn={data.signedIn} />;
    case "tipComposer":
      return <TipComposer wv={wv} signedIn={data.signedIn} />;
    case "wisdomCategories": {
      const category = typeof instance.config.category === "string" ? instance.config.category : "FOOD";
      const label = t(`wisdomCat_${category}`);
      if (instance.kind === "WISDOM_TALLY") {
        const n = wv.tally[category] ?? 0;
        return (
          <div>
            <p className="font-display text-3xl leading-none text-ink">{n}</p>
            <p className="mt-1.5 text-xs text-ink/50">{t("tipsThisWeek", { category: label })}</p>
          </div>
        );
      }
      const newest = wv.newest[category];
      return newest ? (
        <div>
          <p className="truncate text-xs text-ink/40">
            {label} · {newest.topic}
          </p>
          <p className="line-clamp-2 text-sm font-medium text-ink">{newest.place}</p>
          <p className="mt-0.5 line-clamp-3 text-xs text-ink/60">{newest.body}</p>
        </div>
      ) : (
        <Empty label={t("noTipsInCategory", { category: label })} />
      );
    }
    case "pinnedChat": {
      const channelId = typeof instance.config.channelId === "string" ? instance.config.channelId : "general";
      const entry = wv.byChannel[channelId];
      if (!(channelId in wv.byChannel)) return <Empty label={t("pickChannelToTrack")} />;
      return entry ? (
        <div>
          <p className="truncate text-xs text-ink/40">
            {entry.author} · {entry.channelName}
          </p>
          <p className="mt-0.5 line-clamp-3 text-sm font-medium text-ink">{entry.body}</p>
        </div>
      ) : (
        <Empty label={t("noMessagesYet")} />
      );
    }
    case "currency":
      return <CurrencyConverter rates={wv.rates} currency={typeof instance.config.currency === "string" ? instance.config.currency : "USD"} />;
    case "contacts":
      return (
        <ul className="space-y-1">
          {wv.items.map((c) => (
            <li key={c.id}>
              <a href={`tel:${c.number}`} className="focus-ring flex items-center justify-between gap-2 rounded-md px-1.5 py-0.5 text-sm hover:bg-paper-dim">
                <span className="truncate text-ink/75">{c.label}</span>
                <span className="shrink-0 font-medium tabular-nums text-ink">{c.number}</span>
              </a>
            </li>
          ))}
        </ul>
      );
  }
}

function EatsRandom({ data }: { data: WidgetData }) {
  const t = useT("widgets");
  const open = useMemo(() => data.eats.vendors.filter((v) => v.open), [data.eats.vendors]);
  const [pick, setPick] = useState<string | null>(null);
  if (!open.length) return <Empty label={t("noKitchensOpen")} />;
  return (
    <div className="flex h-full flex-col">
      <p className="text-xs text-ink/40">{pick ? t("howAbout") : t("hungry")}</p>
      <p className="truncate text-sm font-medium text-ink">{pick ?? t("tapToPick")}</p>
      <button
        type="button"
        onClick={() => setPick((prev) => {
          const choices = open.filter((v) => v.name !== prev);
          return (choices.length ? choices : open)[Math.floor(Math.random() * (choices.length || open.length))].name;
        })}
        className={`${CTRL_BUTTON} mt-auto w-fit`}
      >
        <Shuffle className="h-3.5 w-3.5" />
        {pick ? t("tryAnother") : t("pickForMe")}
      </button>
    </div>
  );
}

function EatsBusy({ data }: { data: WidgetData }) {
  const t = useT("widgets");
  const open = data.eats.vendors.filter((v) => v.open);
  if (!open.length) return <Empty label={t("noKitchensOpen")} />;
  const counts = new Map(data.eats.busy.map((b) => [b.name, b.count]));
  const ranked = open.map((v) => ({ name: v.name, count: counts.get(v.name) ?? 0 })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const busiest = ranked[0].count > 0 ? ranked[0] : null;
  const quietest = ranked.length > 1 ? ranked[ranked.length - 1] : null;
  return (
    <div className="space-y-1.5 text-sm">
      <p className="truncate">
        <span className="text-xs text-ink/40">{t("busiest")} </span>
        <span className="text-ink/80">{busiest ? `${busiest.name} · ${t("ordersLastHour", { n: busiest.count })}` : t("allQuiet")}</span>
      </p>
      {quietest ? (
        <p className="truncate">
          <span className="text-xs text-ink/40">{t("quietest")} </span>
          <span className="text-ink/80">{quietest.name}</span>
        </p>
      ) : null}
    </div>
  );
}
