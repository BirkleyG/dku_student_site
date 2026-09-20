"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsPostSchema, type NewsPostInput } from "@/lib/news-validation";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function NewArticleForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewsPostInput>({ resolver: zodResolver(newsPostSchema) });

  const onSubmit = async (data: NewsPostInput) => {
    setServerError(null);
    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Couldn't publish that.");
      return;
    }

    const { post } = await res.json();
    router.push(`/news/${post.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Title" {...register("title")} error={errors.title?.message} />
      <Field label="One-line summary" {...register("summary")} error={errors.summary?.message} />

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">Article</span>
        <textarea
          rows={12}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          {...register("body")}
        />
        {errors.body ? <span className="mt-1 block text-xs text-danger">{errors.body.message}</span> : null}
      </label>

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Publishing…" : "Publish"}
      </Button>
    </form>
  );
}
