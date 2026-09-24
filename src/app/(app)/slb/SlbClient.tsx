"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { SlbInitiativeStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

const textareaClass =
  "focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold";

async function send(url: string, method: string, body?: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.error ?? "Something went wrong. Try again.";
}

/** A "New …" button that expands into a form. */
function Composer({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="px-4 py-2">
        <Plus className="h-4 w-4" /> {label}
      </Button>
    );
  }
  return (
    <div className="w-full rounded-lg border border-ink/10 bg-paper p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-medium text-ink">{label}</p>
        <button onClick={() => setOpen(false)} aria-label="Cancel" className="focus-ring rounded-full p-1 text-ink/40 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      {children(() => setOpen(false))}
    </div>
  );
}

export function NewAnnouncement() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Composer label="New announcement">
      {(close) => (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const err = await send("/api/slb/announcements", "POST", { title, body });
            setBusy(false);
            if (err) return setError(err);
            close();
            router.refresh();
          }}
        >
          <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">Announcement</span>
            <textarea rows={5} className={textareaClass} value={body} onChange={(e) => setBody(e.target.value)} required />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post announcement"}</Button>
        </form>
      )}
    </Composer>
  );
}

export function NewPoll() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [closesAt, setClosesAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Composer label="New poll">
      {(close) => (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const err = await send("/api/slb/polls", "POST", {
              question,
              options: options.map((o) => o.trim()).filter(Boolean),
              closesAt: closesAt ? new Date(closesAt).toISOString() : null,
            });
            setBusy(false);
            if (err) return setError(err);
            close();
            router.refresh();
          }}
        >
          <Field label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
          <div className="space-y-2">
            <span className="block text-xs uppercase tracking-[0.15em] text-ink/60">Options</span>
            {options.map((option, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={textareaClass}
                  value={option}
                  placeholder={`Option ${i + 1}`}
                  onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))}
                />
                {options.length > 2 ? (
                  <button
                    type="button"
                    aria-label="Remove option"
                    onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                    className="focus-ring rounded-full px-2 text-ink/40 hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))}
            {options.length < 8 ? (
              <button type="button" onClick={() => setOptions((prev) => [...prev, ""])} className="focus-ring text-sm text-ink/55 hover:text-ink">
                + Add option
              </button>
            ) : null}
          </div>
          <Field label="Closes (optional)" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? "Publishing…" : "Publish poll"}</Button>
        </form>
      )}
    </Composer>
  );
}

export function NewInitiative() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Composer label="Propose an initiative">
      {() => (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const res = await fetch("/api/slb/initiatives", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, summary, body }),
            });
            const data = await res.json().catch(() => ({}));
            setBusy(false);
            if (!res.ok) return setError(data.error ?? "Something went wrong.");
            router.push(`/slb/initiatives/${data.id}`);
          }}
        >
          <Field label="Title" placeholder="e.g. Keep the library open 24/7 during finals" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Field label="One-line summary" value={summary} onChange={(e) => setSummary(e.target.value)} required />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">The agenda</span>
            <textarea
              rows={8}
              className={textareaClass}
              placeholder="What's the problem, what do you propose, and how would it work?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? "Publishing…" : "Publish initiative"}</Button>
        </form>
      )}
    </Composer>
  );
}

type PollOption = { id: string; label: string; votes: number };

export function PollCard({
  pollId,
  options,
  myVote,
  closed,
  loggedIn,
}: {
  pollId: string;
  options: PollOption[];
  myVote: string | null;
  closed: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = options.reduce((sum, o) => sum + o.votes, 0);
  const showResults = closed || myVote !== null;

  const vote = async (optionId: string) => {
    if (!loggedIn) return router.push("/login");
    setBusy(true);
    const err = await send(`/api/slb/polls/${pollId}/vote`, "POST", { optionId });
    setBusy(false);
    if (err) return setError(err);
    router.refresh();
  };

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const pct = total ? Math.round((option.votes / total) * 100) : 0;
        const mine = myVote === option.id;
        return (
          <button
            key={option.id}
            disabled={busy || closed}
            onClick={() => vote(option.id)}
            className={`focus-ring relative block w-full overflow-hidden rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
              mine ? "border-gold" : "border-ink/15 hover:border-ink/35"
            } disabled:cursor-default`}
          >
            {showResults ? <span className="absolute inset-y-0 left-0 bg-gold/15" style={{ width: `${pct}%` }} /> : null}
            <span className="relative flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink">
                {mine ? <Check className="h-4 w-4 text-gold" /> : null}
                {option.label}
              </span>
              {showResults ? <span className="text-xs tabular-nums text-ink/50">{pct}%</span> : null}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-ink/40">
        {total} vote{total === 1 ? "" : "s"}
        {closed ? " · Closed" : myVote ? " · Tap another option to change your vote" : loggedIn ? "" : " · Log in to vote"}
      </p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function InitiativeVote({
  initiativeId,
  yes,
  no,
  myVote,
  closed,
  loggedIn,
}: {
  initiativeId: string;
  yes: number;
  no: number;
  myVote: 1 | -1 | null;
  closed: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = yes + no;
  const yesPct = total ? Math.round((yes / total) * 100) : 0;

  const vote = async (value: 1 | -1) => {
    if (!loggedIn) return router.push("/login");
    setBusy(true);
    const err = await send(`/api/slb/initiatives/${initiativeId}/vote`, "POST", { value: myVote === value ? 0 : value });
    setBusy(false);
    if (err) return setError(err);
    router.refresh();
  };

  const btn = (value: 1 | -1, label: string, Icon: typeof ThumbsUp) => (
    <button
      disabled={busy || closed}
      onClick={() => vote(value)}
      aria-pressed={myVote === value}
      className={`focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-60 ${
        myVote === value
          ? value === 1
            ? "border-sprout-deep bg-sprout-deep text-white"
            : "border-ink bg-ink text-white"
          : "border-ink/20 text-ink hover:border-ink/45"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {btn(1, `Yes, I want this · ${yes}`, ThumbsUp)}
        {btn(-1, `No · ${no}`, ThumbsDown)}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10" aria-hidden>
        <div className="h-full bg-sprout-deep transition-all" style={{ width: `${yesPct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-ink/45">
        {total ? `${yesPct}% support from ${total} vote${total === 1 ? "" : "s"}` : "No votes yet"}
        {closed ? " · Voting closed" : loggedIn ? "" : " · Log in to vote"}
      </p>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function BackButton({ initiativeId, backed }: { initiativeId: string; backed: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={backed ? "secondary" : "primary"}
      disabled={busy}
      className="px-4 py-2"
      onClick={async () => {
        setBusy(true);
        await send(`/api/slb/initiatives/${initiativeId}/back`, backed ? "DELETE" : "POST");
        setBusy(false);
        router.refresh();
      }}
    >
      {backed ? "Withdraw my backing" : "Back this initiative"}
    </Button>
  );
}

const STATUS_OPTIONS: { value: SlbInitiativeStatus; label: string }[] = [
  { value: "PROPOSED", label: "Proposed" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "PASSED", label: "Passed" },
  { value: "NOT_PASSED", label: "Not passed" },
];

export function StatusControl({ initiativeId, status }: { initiativeId: string; status: SlbInitiativeStatus }) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink/60">
      Status
      <select
        defaultValue={status}
        onChange={async (e) => {
          await send(`/api/slb/initiatives/${initiativeId}`, "PATCH", { status: e.target.value });
          router.refresh();
        }}
        className="focus-ring rounded-full border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AboutEditor({ initialBody }: { initialBody: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="focus-ring text-sm text-ink/50 underline-offset-2 hover:text-ink hover:underline">
        Edit this page
      </button>
    );
  }
  return (
    <div className="mt-4 space-y-3">
      <textarea rows={12} className={textareaClass} value={body} onChange={(e) => setBody(e.target.value)} />
      <p className="text-xs text-ink/40">Plain text. Leave a blank line between paragraphs.</p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          className="px-4 py-2"
          onClick={async () => {
            const err = await send("/api/slb/about", "PUT", { body });
            if (err) return setError(err);
            setEditing(false);
            router.refresh();
          }}
        >
          Save
        </Button>
        <Button variant="ghost" className="px-4 py-2" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function AddMember() {
  const router = useRouter();
  const [netIdOrEmail, setNetIdOrEmail] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Composer label="Add an SLB member">
      {(close) => (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const err = await send("/api/slb/members", "POST", { netIdOrEmail, title });
            setBusy(false);
            if (err) return setError(err);
            setNetIdOrEmail("");
            setTitle("");
            close();
            router.refresh();
          }}
        >
          <Field label="NetID or email" value={netIdOrEmail} onChange={(e) => setNetIdOrEmail(e.target.value)} required />
          <Field label="Title" placeholder="e.g. President" value={title} onChange={(e) => setTitle(e.target.value)} required />
          {error ? <p className="text-sm text-danger sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add member"}</Button>
          </div>
        </form>
      )}
    </Composer>
  );
}

export function RemoveMember({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        if (!window.confirm(`Remove ${name} from SLB?`)) return;
        await send(`/api/slb/members/${userId}`, "DELETE");
        router.refresh();
      }}
      className="focus-ring text-xs text-ink/40 hover:text-danger"
    >
      Remove
    </button>
  );
}

/**
 * Roster photo from DKU's CDN. Initials sit underneath and the photo covers
 * them once it loads; if it fails (empty alt hides the broken-image icon),
 * the initials show through. No JS needed, so it works even when the image
 * fails before hydration.
 */
export function RosterPhoto({ src, name }: { src: string; name: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-paper-dim" role="img" aria-label={name}>
      <span className="absolute inset-0 grid place-items-center font-display text-3xl text-ink/30" aria-hidden>
        {initials}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        data-initials={initials}
        // ::before only renders when an image fails to load; it covers the
        // browser's broken-image outline with the same initials tile.
        className="absolute inset-0 h-full w-full object-cover before:absolute before:inset-0 before:grid before:place-items-center before:bg-paper-dim before:font-display before:text-3xl before:text-ink/30 before:content-[attr(data-initials)]"
      />
    </div>
  );
}
