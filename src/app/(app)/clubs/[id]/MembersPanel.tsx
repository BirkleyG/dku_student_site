"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

type Member = { userId: string; role: "MEMBER" | "MANAGER"; name: string; email: string };

export function MembersPanel({
  clubId,
  openJoin,
  canManage,
  isLoggedIn,
  isMember,
  isCreator,
  initialMembers,
}: {
  clubId: string;
  openJoin: boolean;
  canManage: boolean;
  isLoggedIn: boolean;
  isMember: boolean;
  isCreator: boolean;
  initialMembers: Member[];
}) {
  const t = useT("clubs");
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [member, setMember] = useState(isMember);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");

  const join = async () => {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/clubs/${clubId}/join`, { method: "POST" });
    if (res.ok) {
      setMember(true);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t("couldntJoin"));
    }
    setPending(false);
  };

  const leave = async () => {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/clubs/${clubId}/join`, { method: "DELETE" });
    if (res.ok) {
      setMember(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t("couldntLeave"));
    }
    setPending(false);
  };

  const addMember = async () => {
    if (!newEmail.trim()) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/clubs/${clubId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setMembers((prev) => [...prev, { userId: body.membership.userId, role: body.membership.role, name: `${body.membership.user.firstName} ${body.membership.user.lastName}`, email: body.membership.user.email }]);
      setNewEmail("");
    } else {
      setError(body.error ?? t("couldntAddPerson"));
    }
    setPending(false);
  };

  const removeMember = async (userId: string) => {
    if (!window.confirm(t("confirmRemoveMember"))) return;
    const res = await fetch(`/api/clubs/${clubId}/members/${userId}`, { method: "DELETE" });
    if (res.ok) setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const toggleRole = async (userId: string, role: Member["role"]) => {
    const nextRole = role === "MANAGER" ? "MEMBER" : "MANAGER";
    const res = await fetch(`/api/clubs/${clubId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    if (res.ok) setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role: nextRole } : m)));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-[0.15em] text-ink/50">{t("membersHeading", { n: members.length })}</h2>
        {isLoggedIn && !isCreator ? (
          openJoin ? (
            member ? (
              <Button variant="secondary" onClick={leave} disabled={pending}>
                {t("leaveClub")}
              </Button>
            ) : (
              <Button onClick={join} disabled={pending}>
                {t("joinClub")}
              </Button>
            )
          ) : member ? (
            <span className="text-xs text-ink/50">{t("youAreMember")}</span>
          ) : (
            <span className="text-xs text-ink/40">{t("askOfficerToAddYou")}</span>
          )
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}

      <ul className="mt-4 divide-y divide-ink/10">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div>
              <span className="text-ink">{m.name}</span>
              {m.role === "MANAGER" ? (
                <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gold-deep">
                  {t("managerBadge")}
                </span>
              ) : null}
            </div>
            {canManage ? (
              <div className="flex items-center gap-3">
                <button onClick={() => toggleRole(m.userId, m.role)} className="focus-ring text-xs text-ink/50 hover:text-ink">
                  {m.role === "MANAGER" ? t("makeMember") : t("makeManager")}
                </button>
                <button
                  onClick={() => removeMember(m.userId)}
                  aria-label={t("removeMemberAria")}
                  className="focus-ring text-ink/30 hover:text-danger"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </li>
        ))}
        {members.length === 0 ? <li className="py-2 text-sm text-ink/40">{t("noMembersYet")}</li> : null}
      </ul>

      {canManage && !openJoin ? (
        <div className="mt-4 flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t("addMemberByEmailPlaceholder")}
            className="focus-ring flex-1 rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-gold"
          />
          <button
            onClick={addMember}
            disabled={pending}
            className="focus-ring flex items-center gap-1.5 rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink/70 hover:border-gold hover:text-ink"
          >
            <UserPlus className="h-4 w-4" /> {t("addButton")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
