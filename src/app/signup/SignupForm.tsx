"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { signupSchema, studentEmailDomains, type SignupInput } from "@/lib/validation";

type StepKey = "firstName" | "lastName" | "email" | "netId" | "inviteCode" | "password";

type Step = {
  key: StepKey;
  prompt: string;
  placeholder: string;
  type: "text" | "email" | "password";
  optional?: boolean;
};

const steps: Step[] = [
  { key: "firstName", prompt: "First, what's your first name?", placeholder: "Ada", type: "text" },
  { key: "lastName", prompt: "And your last name?", placeholder: "Lovelace", type: "text" },
  {
    key: "email",
    prompt: `What's your DKU email? (${studentEmailDomains.join(" or ")})`,
    placeholder: `you@${studentEmailDomains[0]}`,
    type: "email",
  },
  {
    key: "netId",
    prompt: "What's your NetID?",
    placeholder: "jsmith123",
    type: "text",
  },
  {
    key: "inviteCode",
    prompt: "We're in early beta, so it's invite-only for now. What's your invite code?",
    placeholder: "e.g. K7M2Q9PX",
    type: "text",
  },
  { key: "password", prompt: "Last thing: set a password.", placeholder: "At least 8 characters", type: "password" },
];

type Answers = Partial<Record<StepKey, string>>;

export function SignupForm() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [status, setStatus] = useState<"chatting" | "submitting" | "done">("chatting");
  const inputRef = useRef<HTMLInputElement>(null);

  const done = stepIndex >= steps.length;
  const currentStep = steps[stepIndex];

  const advance = async () => {
    setError(null);
    const step = currentStep;
    const trimmed = value.trim();

    if (step.optional && trimmed === "") {
      commit(step.key, "");
      return;
    }

    const fieldSchema = signupSchema.shape[step.key];
    const result = fieldSchema.safeParse(trimmed);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "That doesn't look right.");
      return;
    }
    commit(step.key, trimmed);
  };

  const commit = (key: StepKey, val: string) => {
    const next = { ...answers, [key]: val };
    setAnswers(next);
    setValue("");
    setStepIndex((i) => i + 1);
    requestAnimationFrame(() => inputRef.current?.focus());

    if (stepIndex + 1 >= steps.length) {
      void submit(next);
    }
  };

  const submit = async (finalAnswers: Answers) => {
    setStatus("submitting");
    setServerError(null);

    const payload: SignupInput = {
      firstName: finalAnswers.firstName ?? "",
      lastName: finalAnswers.lastName ?? "",
      netId: finalAnswers.netId ?? "",
      email: finalAnswers.email ?? "",
      password: finalAnswers.password ?? "",
      inviteCode: finalAnswers.inviteCode ?? "",
    };

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body: { error?: string; field?: "inviteCode" | "email" } = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Something went wrong. Try again.");
      setStatus("chatting");
      // Send them back to whichever step actually failed (an invalid/used/
      // rate-limited invite code, or an email that doesn't match the netID)
      // rather than always the last step.
      const targetKey: StepKey = body.field === "email" ? "email" : "inviteCode";
      const targetIndex = steps.findIndex((s) => s.key === targetKey);
      setStepIndex(targetIndex >= 0 ? targetIndex : steps.length - 1);
      return;
    }

    const signInRes = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    if (signInRes?.error) {
      // Account was created but the automatic sign-in failed for some reason —
      // send them to log in manually instead of stranding them here.
      router.push("/login");
      return;
    }

    setStatus("done");
    setTimeout(() => {
      router.push("/home");
      router.refresh();
    }, 1600);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void advance();
    }
  };

  const displayValue = (key: StepKey) => (key === "password" ? "•".repeat(answers[key]?.length ?? 0) : answers[key]);

  const transcript = useMemo(() => steps.slice(0, stepIndex), [stepIndex]);

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-sprout-deep/30 bg-sprout/20 p-8 text-center"
      >
        <p className="font-display text-2xl text-sprout-deep">Welcome, {answers.firstName}.</p>
        <p className="mt-2 text-ink/70">Your DKU Life account is ready. Taking you home.</p>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {transcript.map((step) => (
          <div key={step.key} className="space-y-2">
            <ChatBubble from="dku">{step.prompt}</ChatBubble>
            <ChatBubble from="you">{displayValue(step.key) || "–"}</ChatBubble>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4"
          >
            <ChatBubble from="dku">{currentStep.prompt}</ChatBubble>

            <div className="mt-3 flex gap-2">
              <input
                ref={inputRef}
                autoFocus
                type={currentStep.type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={currentStep.placeholder}
                className="focus-ring w-full rounded-2xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
              />
              <button
                onClick={() => void advance()}
                disabled={status === "submitting"}
                className="focus-ring shrink-0 rounded-2xl bg-gold px-5 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold-bright disabled:opacity-50"
              >
                {status === "submitting" ? "…" : currentStep.optional && !value ? "Skip" : "↵"}
              </button>
            </div>

            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {serverError ? <p className="mt-4 text-sm text-danger">{serverError}</p> : null}
    </div>
  );
}

function ChatBubble({ from, children }: { from: "dku" | "you"; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${from === "you" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          from === "you" ? "bg-ink text-white" : "bg-paper-dim text-ink/85"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}
