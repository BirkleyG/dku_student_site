"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Props = {
  /** "modal" keeps the user on the current page instead of redirecting to /home. */
  mode?: "page" | "modal";
  /** Called right after a successful login when mode is "modal" (e.g. to close it). */
  onSuccess?: () => void;
};

export function LoginForm({ mode = "page", onSuccess }: Props = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const rawCallbackUrl = params.get("callbackUrl");
  // Only ever redirect to a same-site path — never follow an absolute URL a
  // ?callbackUrl= query param could be crafted to point somewhere else.
  const callbackUrl = rawCallbackUrl && rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//") && !rawCallbackUrl.startsWith("/\\")
    ? rawCallbackUrl
    : "/home";

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
    if (mode === "modal") {
      onSuccess?.();
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
