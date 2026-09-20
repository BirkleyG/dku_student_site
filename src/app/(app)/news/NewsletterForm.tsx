"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "done" : "error");
  };

  if (status === "done") {
    return <p className="text-sm text-sprout-deep">You&apos;re on the list — new issues will land in your inbox.</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@dukekunshan.edu.cn"
        className="focus-ring min-w-0 flex-1 rounded-full border border-ink/15 bg-paper-dim px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-gold"
      />
      <Button type="submit" disabled={status === "loading"} className="shrink-0">
        {status === "loading" ? "…" : "Subscribe"}
      </Button>
      {status === "error" ? <p className="w-full text-xs text-danger">Something went wrong. Try again.</p> : null}
    </form>
  );
}
