"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const verifiedMessages: Record<string, string> = {
  "1": "Email verified — welcome to DKU Life.",
  expired: "That verification link expired. Log in and we'll send you a new one.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const verifiedNote = params.get("verified") ? verifiedMessages[params.get("verified")!] : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push("/home");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {verifiedNote ? <p className="rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal">{verifiedNote}</p> : null}

      <Field label="DKU email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
