"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signupSchema, type SignupInput } from "@/lib/validation";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const domain = process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN ?? "dukekunshan.edu.cn";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupInput) => {
    setServerError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Something went wrong. Try again.");
      return;
    }

    setSubmitted(true);
    setTimeout(() => router.push("/login"), 2500);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-teal/30 bg-teal/10 p-8 text-center"
      >
        <p className="font-display text-2xl text-teal">Almost there.</p>
        <p className="mt-2 text-paper/70">
          We sent a verification link to your inbox. Confirm it, then come back and log in.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" {...register("firstName")} error={errors.firstName?.message} />
        <Field label="Last name" {...register("lastName")} error={errors.lastName?.message} />
      </div>
      <Field label="Net ID (optional)" placeholder="jsmith123" {...register("netId")} error={errors.netId?.message} />
      <Field
        label="DKU email"
        type="email"
        placeholder={`you@${domain}`}
        {...register("email")}
        error={errors.email?.message}
      />
      <Field label="Password" type="password" {...register("password")} error={errors.password?.message} />

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
