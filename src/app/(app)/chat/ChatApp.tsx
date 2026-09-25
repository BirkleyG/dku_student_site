"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Hash, MessageCircle, Plus, UserPlus, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { JoinGroupModal } from "./JoinGroupModal";
import { NewDmModal } from "./NewDmModal";

const POLL_MS = 4000;

type SidebarChannel = { id: string; name: string; description: string | null };
type SidebarDm = { id: string; name: string; otherUserId: string | null };
type SidebarData = { general: SidebarChannel; groups: SidebarChannel[]; dms: SidebarDm[] };

type ChatUser = { id: string; firstName: string; lastName: string };
type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: ChatUser;
  _count?: { replies: number };
};

type SelectedChannel = { id: string; name: string; description: string | null; kind: "GENERAL" | "GROUP" | "DIRECT" };

/** Resolves a `?channel=` id from a push deep link against the loaded sidebar, falling back to General. */
function resolveRequestedChannel(data: SidebarData, requestedChannelId: string | null): SelectedChannel {
  if (requestedChannelId) {
    if (data.general.id === requestedChannelId) return { ...data.general, kind: "GENERAL" };
    const group = data.groups.find((g) => g.id === requestedChannelId);
    if (group) return { ...group, kind: "GROUP" };
    const dm = data.dms.find((d) => d.id === requestedChannelId);
    if (dm) return { ...dm, description: null, kind: "DIRECT" };
  }
  return { ...data.general, kind: "GENERAL" };
}

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

export function ChatApp({ currentUserName }: { currentUserName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // A push notification's click target links here as /chat?channel=<id>[&thread=<id>] —
  // read once on mount so a fresh load opens straight into the right chat.
  const requestedChannelId = useRef(searchParams.get("channel")).current;
  const requestedThreadId = useRef(searchParams.get("thread")).current;
  const [sidebar, setSidebar] = useState<SidebarData | null>(null);
  const [selected, setSelected] = useState<SelectedChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const [threadRoot, setThreadRoot] = useState<ChatMessage | null>(null);
  const [threadReplies, setThreadReplies] = useState<ChatMessage[]>([]);
  const [threadComposer, setThreadComposer] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [showDm, setShowDm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reusable for handler-triggered reloads (join, DM, after sending). Not
  // called directly from an effect body — see the inline fetches below,
  // which the lint's set-state-in-effect check can verify are deferred.
  const loadSidebar = useCallback(async () => {
    try {
      const data = (await jsonFetch("/api/chat/channels")) as SidebarData;
      setSidebar(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load Chat");
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    jsonFetch("/api/chat/channels")
      .then((data: SidebarData) => {
        if (cancelled) return;
        setSidebar(data);
        setSelected((prev) => prev ?? resolveRequestedChannel(data, requestedChannelId));
        if (requestedThreadId) setThreadRootId(requestedThreadId);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load Chat");
      });
    return () => {
      cancelled = true;
    };
    // requestedChannelId/requestedThreadId come from a ref (read once on mount) and never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMessages = useCallback(async (channelId: string) => {
    try {
      const data = await jsonFetch(`/api/chat/channels/${channelId}/messages`);
      setMessages(data.messages ?? []);
    } catch {
      // A transient poll failure shouldn't clear what's already on screen.
    }
  }, []);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const tick = () => {
      jsonFetch(`/api/chat/channels/${selected.id}/messages`)
        .then((data) => {
          if (!cancelled) setMessages(data.messages ?? []);
        })
        .catch(() => {
          // A transient poll failure shouldn't clear what's already on screen.
        });
    };
    tick();
    const interval = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!selected || !threadRootId) return;
    let cancelled = false;
    const tick = () => {
      jsonFetch(`/api/chat/channels/${selected.id}/messages?parentId=${threadRootId}`)
        .then((data) => {
          if (cancelled) return;
          setThreadRoot(data.root);
          setThreadReplies(data.replies ?? []);
        })
        .catch(() => {
          // ignore transient poll failures
        });
    };
    tick();
    const interval = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selected, threadRootId]);

  const openThread = (message: ChatMessage) => {
    setThreadRootId(message.id);
    setThreadRoot(message);
    setThreadReplies([]);
  };

  const closeThread = () => {
    setThreadRootId(null);
    setThreadRoot(null);
    setThreadReplies([]);
    setThreadComposer("");
  };

  const selectChannel = (channel: SelectedChannel) => {
    closeThread();
    setMessages([]);
    setSelected(channel);
  };

  const send = async (parentId?: string) => {
    if (!selected) return;
    const value = parentId ? threadComposer : composer;
    if (!value.trim()) return;
    setSending(true);
    setError(null);
    try {
      const data = await jsonFetch(`/api/chat/channels/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: value, parentId }),
      });
      if (parentId) {
        setThreadReplies((prev) => [...prev, data.message]);
        setThreadComposer("");
        void loadMessages(selected.id);
      } else {
        setMessages((prev) => [...prev, { ...data.message, _count: { replies: 0 } }]);
        setComposer("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that message");
    } finally {
      setSending(false);
    }
  };

  const joinAndSelect = async (channel: SidebarChannel) => {
    setShowJoin(false);
    await loadSidebar();
    selectChannel({ ...channel, kind: "GROUP" });
  };

  const startDm = async (user: ChatUser) => {
    setShowDm(false);
    try {
      const data = await jsonFetch("/api/chat/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      await loadSidebar();
      selectChannel({ id: data.channel.id, name: data.channel.name, description: null, kind: "DIRECT" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start that conversation");
    }
  };

  if (!sidebar || !selected) {
    return (
      <div className="flex h-[calc(100svh-var(--header-h))] items-center justify-center">
        <p className="text-sm text-ink/40">{error ?? "Loading Chat…"}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-h))] w-full">
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-ink/10 bg-paper-dim px-3 py-4 sm:flex">
        <SidebarSection label="Everyone">
          <SidebarRow
            icon={<Hash className="h-4 w-4" />}
            label={sidebar.general.name}
            active={selected.id === sidebar.general.id}
            onClick={() => selectChannel({ ...sidebar.general, kind: "GENERAL" })}
          />
        </SidebarSection>

        <SidebarSection
          label="Groups"
          action={
            <button onClick={() => setShowJoin(true)} className="focus-ring text-ink/40 hover:text-ink" aria-label="Join a group">
              <Plus className="h-3.5 w-3.5" />
            </button>
          }
        >
          {sidebar.groups.length === 0 ? (
            <p className="px-2.5 py-1 text-xs text-ink/35">No groups joined yet.</p>
          ) : (
            sidebar.groups.map((g) => (
              <SidebarRow
                key={g.id}
                icon={<Hash className="h-4 w-4" />}
                label={g.name}
                active={selected.id === g.id}
                onClick={() => selectChannel({ ...g, kind: "GROUP" })}
              />
            ))
          )}
          <button
            onClick={() => setShowJoin(true)}
            className="focus-ring mt-1 block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-ink/45 hover:bg-paper hover:text-ink"
          >
            + Join with invite code
          </button>
        </SidebarSection>

        <SidebarSection
          label="Direct messages"
          action={
            <button onClick={() => setShowDm(true)} className="focus-ring text-ink/40 hover:text-ink" aria-label="New message">
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          }
        >
          {sidebar.dms.length === 0 ? (
            <p className="px-2.5 py-1 text-xs text-ink/35">No conversations yet.</p>
          ) : (
            sidebar.dms.map((d) => (
              <SidebarRow
                key={d.id}
                icon={<MessageCircle className="h-4 w-4" />}
                label={d.name}
                active={selected.id === d.id}
                onClick={() => selectChannel({ ...d, description: null, kind: "DIRECT" })}
              />
            ))
          )}
        </SidebarSection>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-ink/10 px-5 py-3.5">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg text-ink">{selected.name}</h1>
            {selected.description ? <p className="truncate text-xs text-ink/45">{selected.description}</p> : null}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink/40">Nothing here yet. Say the first thing.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <MessageRow key={m.id} message={m} onOpenThread={() => openThread(m)} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error ? <p className="px-5 pb-1 text-xs text-danger">{error}</p> : null}

        <div className="shrink-0 border-t border-ink/10 p-4">
          <Composer
            value={composer}
            onChange={setComposer}
            onSend={() => void send()}
            disabled={sending}
            placeholder={`Message ${selected.name}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {threadRootId && threadRoot ? (
          <ThreadPanel
            root={threadRoot}
            replies={threadReplies}
            composer={threadComposer}
            onComposerChange={setThreadComposer}
            onSend={() => void send(threadRootId)}
            onClose={closeThread}
            sending={sending}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showJoin ? (
          <JoinGroupModal
            onClose={() => setShowJoin(false)}
            onJoined={(channel) => {
              void joinAndSelect(channel);
              router.refresh();
            }}
          />
        ) : null}
        {showDm ? <NewDmModal onClose={() => setShowDm(false)} onSelected={(u) => void startDm(u)} /> : null}
      </AnimatePresence>

      <p className="sr-only">Signed in as {currentUserName}</p>
    </div>
  );
}

function SidebarSection({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="flex items-center justify-between px-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink/35">{label}</p>
        {action}
      </div>
      <div className="mt-1.5 space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarRow({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
        active ? "bg-gold/15 text-ink" : "text-ink/65 hover:bg-paper hover:text-ink"
      }`}
    >
      <span className="text-ink/40">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function MessageRow({
  message,
  onOpenThread,
}: {
  message: ChatMessage;
  onOpenThread?: () => void;
}) {
  const replyCount = message._count?.replies ?? 0;
  return (
    <div className="group">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-ink">
          {message.author.firstName} {message.author.lastName}
        </span>
        <span className="text-xs text-ink/35">{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
      </div>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink/80">{message.body}</p>
      {onOpenThread ? (
        <button
          onClick={onOpenThread}
          className={`focus-ring mt-1 text-xs transition-colors ${
            replyCount > 0 ? "font-medium text-gold-bright hover:underline" : "text-ink/0 group-hover:text-ink/40 hover:!text-ink"
          }`}
        >
          {replyCount > 0 ? `${replyCount} repl${replyCount === 1 ? "y" : "ies"}` : "Reply in thread"}
        </button>
      ) : null}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex items-end gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={placeholder}
        rows={1}
        className="focus-ring w-full resize-none rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-gold"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="focus-ring shrink-0 rounded-full bg-gold px-4 py-2.5 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold-bright disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}

function ThreadPanel({
  root,
  replies,
  composer,
  onComposerChange,
  onSend,
  onClose,
  sending,
}: {
  root: ChatMessage;
  replies: ChatMessage[];
  composer: string;
  onComposerChange: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  sending: boolean;
}) {
  return (
    <div className="flex w-full max-w-sm shrink-0 flex-col border-l border-ink/10 bg-paper sm:w-96">
      <header className="flex shrink-0 items-center justify-between border-b border-ink/10 px-4 py-3.5">
        <h2 className="font-display text-base text-ink">Thread</h2>
        <button onClick={onClose} className="focus-ring rounded-full p-1 text-ink/50 hover:text-ink" aria-label="Close thread">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="border-b border-ink/10 pb-4">
          <MessageRow message={root} />
        </div>
        {replies.map((r) => (
          <MessageRow key={r.id} message={r} />
        ))}
      </div>
      <div className="shrink-0 border-t border-ink/10 p-3">
        <Composer value={composer} onChange={onComposerChange} onSend={onSend} disabled={sending} placeholder="Reply in thread" />
      </div>
    </div>
  );
}
