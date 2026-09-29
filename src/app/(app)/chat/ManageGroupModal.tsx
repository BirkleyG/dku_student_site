"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { UserPicker, type PickedUser } from "./UserPicker";

type MembersData = {
  ownerId: string | null;
  canManage: boolean;
  members: PickedUser[];
  pendingInvites: { id: string; user: PickedUser }[];
};

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

/** Members list for any member (with Leave); rename / invite / remove / delete for the owner. */
export function ManageGroupModal({
  channel,
  currentUserId,
  onClose,
  onChanged,
  onLeftOrDeleted,
}: {
  channel: { id: string; name: string; description: string | null };
  currentUserId: string;
  onClose: () => void;
  onChanged: () => void;
  onLeftOrDeleted: () => void;
}) {
  const t = useT("chat");
  const [data, setData] = useState<MembersData | null>(null);
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? "");
  const [invitees, setInvitees] = useState<PickedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData((await api(`/api/chat/channels/${channel.id}/members`, "GET")) as MembersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadError"));
    }
  }, [channel.id, t]);

  useEffect(() => {
    let cancelled = false;
    api(`/api/chat/channels/${channel.id}/members`, "GET")
      .then((d) => {
        if (!cancelled) setData(d as MembersData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("loadError"));
      });
    return () => {
      cancelled = true;
    };
  }, [channel.id, t]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("manageError"));
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      await api(`/api/chat/channels/${channel.id}`, "PATCH", { name: name.trim(), description: description.trim() || undefined });
      onChanged();
    });

  const invite = () =>
    run(async () => {
      await api(`/api/chat/channels/${channel.id}/invites`, "POST", { userIds: invitees.map((u) => u.id) });
      setInvitees([]);
      await reload();
    });

  const removeMember = (userId: string) =>
    run(async () => {
      await api(`/api/chat/channels/${channel.id}/members`, "DELETE", { userId });
      if (userId === currentUserId) {
        onLeftOrDeleted();
        return;
      }
      await reload();
      onChanged();
    });

  const deleteGroup = () =>
    run(async () => {
      if (!window.confirm(t("deleteGroupConfirm"))) return;
      await api(`/api/chat/channels/${channel.id}`, "DELETE");
      onLeftOrDeleted();
    });

  const canManage = data?.canManage ?? false;
  const isOwner = data?.ownerId === currentUserId;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[90svh] w-full overflow-y-auto rounded-t-3xl border border-ink/10 bg-paper p-5 sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{t("manageGroup")}</h2>
          <button onClick={onClose} className="focus-ring rounded-full p-1.5 text-ink/50 hover:text-ink" aria-label={t("closeAria")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {canManage ? (
          <div className="mt-4 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              aria-label={t("groupNameLabel")}
              className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-ink focus:border-gold"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              placeholder={t("groupDescriptionPlaceholder")}
              aria-label={t("groupDescriptionLabel")}
              className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-ink placeholder:text-ink/30 focus:border-gold"
            />
            <Button onClick={() => void save()} disabled={busy || name.trim().length < 2} className="w-full">
              {t("saveGroup")}
            </Button>
          </div>
        ) : null}

        <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-ink/40">{t("membersHeading")}</p>
        <ul className="space-y-1">
          {data?.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-xl px-3 py-1.5 text-sm text-ink/80">
              <span>
                {m.firstName} {m.lastName}
                {m.id === data.ownerId ? <span className="ml-2 text-xs text-ink/40">{t("ownerBadge")}</span> : null}
              </span>
              {canManage && m.id !== data.ownerId ? (
                <button
                  onClick={() => void removeMember(m.id)}
                  disabled={busy}
                  className="focus-ring text-xs text-danger hover:underline"
                >
                  {t("removeMember")}
                </button>
              ) : null}
            </li>
          ))}
          {data?.pendingInvites.map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded-xl px-3 py-1.5 text-sm text-ink/45">
              <span>
                {i.user.firstName} {i.user.lastName}
              </span>
              <span className="text-xs">{t("invitePending")}</span>
            </li>
          ))}
        </ul>

        {canManage ? (
          <>
            <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-ink/40">{t("invitePeople")}</p>
            <UserPicker
              selected={invitees}
              onChange={setInvitees}
              excludeIds={[...(data?.members.map((m) => m.id) ?? []), ...(data?.pendingInvites.map((i) => i.user.id) ?? [])]}
            />
            <Button onClick={() => void invite()} disabled={busy || invitees.length === 0} className="mt-3 w-full">
              {t("sendInvites")}
            </Button>
          </>
        ) : null}

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <div className="mt-5 flex flex-col gap-2">
          {data && !isOwner ? (
            <button
              onClick={() => void removeMember(currentUserId)}
              disabled={busy}
              className="focus-ring rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink/70 hover:text-ink"
            >
              {t("leaveGroup")}
            </button>
          ) : null}
          {canManage ? (
            <button
              onClick={() => void deleteGroup()}
              disabled={busy}
              className="focus-ring rounded-xl border border-danger/40 px-4 py-2 text-sm text-danger hover:bg-danger/5"
            >
              {t("deleteGroup")}
            </button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
