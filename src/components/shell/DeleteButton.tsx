"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  endpoint,
  redirectTo,
  confirmText = "Remove this?",
  label = "Remove",
}: {
  endpoint: string;
  redirectTo: string;
  confirmText?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (!window.confirm(confirmText)) return;
    setPending(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    if (res.ok) {
      router.push(redirectTo);
      router.refresh();
    } else {
      setPending(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="focus-ring inline-flex items-center gap-1.5 text-xs text-ink/40 transition-colors hover:text-danger disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Removing…" : label}
    </button>
  );
}
