"use client";

import { useState } from "react";
import type { AdminScope, Role } from "@prisma/client";
import { ADMIN_SCOPES } from "@/lib/permissions";

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  netId: string | null;
  role: Role;
  adminScopes: AdminScope[];
  emailVerified: string | null;
};

export function UsersPanel({ initialUsers, currentUserId }: { initialUsers: AdminUser[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);

  const patch = async (id: string, data: Partial<Pick<AdminUser, "role" | "adminScopes">>) => {
    setSavingId(id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
    setSavingId(null);
  };

  const toggleScope = (user: AdminUser, scope: AdminScope) => {
    const next = user.adminScopes.includes(scope)
      ? user.adminScopes.filter((s) => s !== scope)
      : [...user.adminScopes, scope];
    void patch(user.id, { adminScopes: next });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/45">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">NetID</th>
            <th className="py-2 pr-4">Super admin</th>
            {ADMIN_SCOPES.map((s) => (
              <th key={s.key} className="py-2 pr-3 text-center" title={s.description}>
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <tr key={user.id} className="border-b border-ink/5">
                <td className="py-2.5 pr-4">
                  <span className="font-medium text-ink">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="block text-xs text-ink/45">{user.email}</span>
                </td>
                <td className="py-2.5 pr-4 text-ink/70">{user.netId ?? "—"}</td>
                <td className="py-2.5 pr-4">
                  <input
                    type="checkbox"
                    disabled={isSelf || savingId === user.id}
                    checked={user.role === "ADMIN"}
                    onChange={(e) => patch(user.id, { role: e.target.checked ? "ADMIN" : "STUDENT" })}
                    className="h-4 w-4 accent-gold disabled:opacity-40"
                  />
                </td>
                {ADMIN_SCOPES.map((s) => (
                  <td key={s.key} className="py-2.5 pr-3 text-center">
                    <input
                      type="checkbox"
                      disabled={isSelf || user.role === "ADMIN" || savingId === user.id}
                      checked={user.role === "ADMIN" || user.adminScopes.includes(s.key)}
                      onChange={() => toggleScope(user, s.key)}
                      className="h-4 w-4 accent-gold disabled:opacity-40"
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-ink/40">
        Super admin grants every scope automatically. You can&apos;t change your own permissions here.
      </p>
    </div>
  );
}
