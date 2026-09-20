"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { boardPostSchema, type BoardPostInput } from "@/lib/board-validation";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function NewPostForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BoardPostInput>({ resolver: zodResolver(boardPostSchema) });

  const onSubmit = async (data: BoardPostInput) => {
    setServerError(null);
    const res = await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Couldn't post that.");
      return;
    }

    const { post } = await res.json();
    router.push(`/social/${post.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Title" {...register("title")} error={errors.title?.message} />

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">What&apos;s on your mind?</span>
        <textarea
          rows={6}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          {...register("body")}
        />
        {errors.body ? <span className="mt-1 block text-xs text-danger">{errors.body.message}</span> : null}
      </label>

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Posting…" : "Post to the board"}
      </Button>
    </form>
  );
}
