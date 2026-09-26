"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Hash, MessageCircle, MessageSquare, Plus, SmilePlus, UserPlus, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { JoinGroupModal } from "./JoinGroupModal";
import { NewDmModal } from "./NewDmModal";
import { REACTION_EMOJI } from "@/lib/chat-reactions";
import { useT } from "@/lib/i18n/client";

const POLL_MS = 4000;

type SidebarChannel = { id: string; name: string; description: string | null };
type SidebarDm = { id: string; name: string; otherUserId: string | null };
type SidebarData = { general: SidebarChannel; groups: SidebarChannel[]; dms: SidebarDm[] };

type ChatUser = { id: string; firstName: string; lastName: string };
type ChatReaction = { id: string; emoji: string; userId: string };
type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: ChatUser;
  reactions?: ChatReaction[];
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

export function ChatApp({ currentUserId, currentUserName }: { currentUserId: string; currentUserName: string }) {
  const t = useT("chat");
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
      setError(err instanceof Error ? err.message : t("loadError"));
      return null;
    }
  }, [t]);

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
        if (!cancelled) setError(err instanceof Error ? err.message : t("loadError"));
      });
    return () => {
      cancelled = true;
    };
    // requestedChannelId/requestedThreadId come from a ref (read once on mount) and never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

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
      setError(err instanceof Error ? err.message : t("sendError"));
    } finally {
      setSending(false);
    }
  };

  const react = async (messageId: string, emoji: string) => {
    try {
      const data = await jsonFetch(`/api/chat/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const reactions = (data.reactions ?? []) as ChatReaction[];
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
      setThreadRoot((prev) => (prev && prev.id === messageId ? { ...prev, reactions } : prev));
      setThreadReplies((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reactError"));
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
      setError(err instanceof Error ? err.message : t("dmError"));
    }
  };

  if (!sidebar || !selected) {
    return (
      <div className="flex h-[calc(100svh-var(--header-h))] items-center justify-center">
        <p className="text-sm text-ink/40">{error ?? t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-h))] w-full">
      <aside data-tour="chat-channel-list" className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-ink/10 bg-paper-dim px-3 py-4 sm:flex">
        <SidebarSection label={t("everyoneSection")}>
          <SidebarRow
            icon={<Hash className="h-4 w-4" />}
            label={sidebar.general.name}
            active={selected.id === sidebar.general.id}
            onClick={() => selectChannel({ ...sidebar.general, kind: "GENERAL" })}
          />
        </SidebarSection>

        <SidebarSection
          label={t("groupsSection")}
          action={
            <button onClick={() => setShowJoin(true)} className="focus-ring text-ink/40 hover:text-ink" aria-label={t("joinGroup")}>
              <Plus className="h-3.5 w-3.5" />
            </button>
          }
        >
          {sidebar.groups.length === 0 ? (
            <p className="px-2.5 py-1 text-xs text-ink/35">{t("noGroupsYet")}</p>
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
            {t("joinWithInviteCode")}
          </button>
        </SidebarSection>

        <SidebarSection
          label={t("directMessagesSection")}
          action={
            <button onClick={() => setShowDm(true)} className="focus-ring text-ink/40 hover:text-ink" aria-label={t("newMessage")}>
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          }
        >
          {sidebar.dms.length === 0 ? (
            <p className="px-2.5 py-1 text-xs text-ink/35">{t("noConversationsYet")}</p>
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
            <p className="mt-10 text-center text-sm text-ink/40">{t("emptyChannel")}</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  isMine={m.author.id === currentUserId}
                  currentUserId={currentUserId}
                  onOpenThread={() => openThread(m)}
                  onReact={(emoji) => void react(m.id, emoji)}
                />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error ? <p className="px-5 pb-1 text-xs text-danger">{error}</p> : null}

        <div data-tour="chat-composer" className="shrink-0 border-t border-ink/10 p-4">
          <Composer
            value={composer}
            onChange={setComposer}
            onSend={() => void send()}
            disabled={sending}
            placeholder={t("messagePlaceholder", { name: selected.name })}
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
            currentUserId={currentUserId}
            onReact={(id, emoji) => void react(id, emoji)}
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

      <p className="sr-only">{t("signedInAs", { name: currentUserName })}</p>
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

const AVATAR_COLORS = ["bg-gold/25 text-ink", "bg-sprout/25 text-ink", "bg-ink/15 text-ink", "bg-danger/15 text-ink"];

function avatarColorFor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function groupReactions(reactions: ChatReaction[] | undefined, currentUserId: string) {
  const groups = new Map<string, { emoji: string; count: number; mine: boolean }>();
  for (const r of reactions ?? []) {
    const g = groups.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    g.count += 1;
    if (r.userId === currentUserId) g.mine = true;
    groups.set(r.emoji, g);
  }
  return [...groups.values()];
}

function Avatar({ user }: { user: ChatUser }) {
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColorFor(user.id)}`}
    >
      {initials}
    </div>
  );
}

function MessageRow({
  message,
  isMine,
  currentUserId,
  onOpenThread,
  onReact,
}: {
  message: ChatMessage;
  isMine: boolean;
  currentUserId: string;
  onOpenThread?: () => void;
  onReact: (emoji: string) => void;
}) {
  const t = useT("chat");
  const [pickerOpen, setPickerOpen] = useState(false);
  const replyCount = message._count?.replies ?? 0;
  const reactionGroups = groupReactions(message.reactions, currentUserId);

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
      <Avatar user={message.author} />
      <div className={`flex max-w-[75%] flex-col ${isMine ? "items-end" : "items-start"}`}>
        <div className={`flex items-baseline gap-2 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-medium text-ink/70">
            {isMine ? t("you") : `${message.author.firstName} ${message.author.lastName}`}
          </span>
          <span className="text-[11px] text-ink/35">{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
        </div>

        <div
          className={`mt-0.5 whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isMine ? "rounded-br-sm bg-gold/20 text-ink" : "rounded-bl-sm bg-paper-dim text-ink/85"
          }`}
        >
          {message.body}
        </div>

        {reactionGroups.length > 0 ? (
          <div className={`mt-1 flex flex-wrap gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {reactionGroups.map((g) => (
              <button
                key={g.emoji}
                onClick={() => onReact(g.emoji)}
                className={`focus-ring flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                  g.mine ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/60 hover:border-ink/30"
                }`}
              >
                <span>{g.emoji}</span>
                <span>{g.count}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className={`relative mt-1 flex items-center gap-1 ${isMine ? "flex-row-reverse" : ""}`}>
          {onOpenThread ? (
            <button
              onClick={onOpenThread}
              className={`focus-ring flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                replyCount > 0 ? "bg-gold/10 font-medium text-gold-bright" : "text-ink/40 hover:bg-paper-dim hover:text-ink"
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              {replyCount > 0
                ? replyCount === 1
                  ? t("replyCountOne", { n: replyCount })
                  : t("replyCountOther", { n: replyCount })
                : t("replyInThread")}
            </button>
          ) : null}

          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="focus-ring flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-ink/40 transition-colors hover:bg-paper-dim hover:text-ink"
            aria-label={t("addReactionAria")}
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </button>

          {pickerOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute bottom-full z-10 mb-1 flex gap-0.5 rounded-full border border-ink/10 bg-paper p-1 shadow-lg ${
                isMine ? "right-0" : "left-0"
              }`}
            >
              {REACTION_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(emoji);
                    setPickerOpen(false);
                  }}
                  className="focus-ring rounded-full p-1 text-base transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          ) : null}
        </div>
      </div>
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
  const t = useT("chat");
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
        {t("send")}
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
  currentUserId,
  onReact,
}: {
  root: ChatMessage;
  replies: ChatMessage[];
  composer: string;
  onComposerChange: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  sending: boolean;
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
}) {
  const t = useT("chat");
  return (
    <div className="flex w-full max-w-sm shrink-0 flex-col border-l border-ink/10 bg-paper sm:w-96">
      <header className="flex shrink-0 items-center justify-between border-b border-ink/10 px-4 py-3.5">
        <h2 className="font-display text-base text-ink">{t("threadHeading")}</h2>
        <button onClick={onClose} className="focus-ring rounded-full p-1 text-ink/50 hover:text-ink" aria-label={t("closeThreadAria")}>
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="border-b border-ink/10 pb-4">
          <MessageRow
            message={root}
            isMine={root.author.id === currentUserId}
            currentUserId={currentUserId}
            onReact={(emoji) => onReact(root.id, emoji)}
          />
        </div>
        {replies.map((r) => (
          <MessageRow
            key={r.id}
            message={r}
            isMine={r.author.id === currentUserId}
            currentUserId={currentUserId}
            onReact={(emoji) => onReact(r.id, emoji)}
          />
        ))}
      </div>
      <div className="shrink-0 border-t border-ink/10 p-3">
        <Composer value={composer} onChange={onComposerChange} onSend={onSend} disabled={sending} placeholder={t("replyInThread")} />
      </div>
    </div>
  );
}
