"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { UserPicker, type PickedUser } from "./UserPicker";

export function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (channel: { id: string; name: string; description: string | null; createdById: string | null }) => void;
}) {
  const t = useT("chat");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [invitees, setInvitees] = useState<PickedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const create = async () => {
    if (name.trim().length < 2) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/chat/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? t("createGroupError"));
      setSubmitting(false);
      return;
    }
    if (invitees.length > 0) {
      // The group exists either way; a failed invite batch can be retried from Manage group.
      await fetch(`/api/chat/channels/${data.channel.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: invitees.map((u) => u.id) }),
      }).catch(() => undefined);
    }
    onCreated(data.channel);
  };

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
        className="max-h-[90svh] w-full overflow-y-auto rounded-t-3xl border border-ink/10 bg-paper p-5 sm:max-w-sm sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{t("createGroup")}</h2>
          <button onClick={onClose} className="focus-ring rounded-full p-1.5 text-ink/50 hover:text-ink" aria-label={t("closeAria")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-ink/50">{t("createGroupDescription")}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder={t("groupNamePlaceholder")}
          aria-label={t("groupNameLabel")}
          autoFocus
          className="focus-ring mt-4 w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-ink placeholder:text-ink/30 focus:border-gold"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={280}
          placeholder={t("groupDescriptionPlaceholder")}
          aria-label={t("groupDescriptionLabel")}
          className="focus-ring mt-2 w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-2.5 text-ink placeholder:text-ink/30 focus:border-gold"
        />
        <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-ink/40">{t("invitePeople")}</p>
        <UserPicker selected={invitees} onChange={setInvitees} />
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <Button onClick={() => void create()} disabled={submitting || name.trim().length < 2} className="mt-4 w-full">
          {submitting ? t("creatingGroup") : t("createGroupButton")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
