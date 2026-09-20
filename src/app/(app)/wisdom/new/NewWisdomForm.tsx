"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { wisdomPostSchema, wisdomCategories, wisdomCategoryLabels, type WisdomPostInput } from "@/lib/wisdom-validation";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function NewWisdomForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WisdomPostInput>({ resolver: zodResolver(wisdomPostSchema), defaultValues: { category: "FOOD" } });

  const onSubmit = async (data: WisdomPostInput) => {
    setServerError(null);
    const res = await fetch("/api/wisdom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Couldn't post that.");
      return;
    }

    router.push("/wisdom");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Title" placeholder="Best dumplings near East Campus" {...register("title")} error={errors.title?.message} />

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">Category</span>
        <select
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
          {...register("category")}
        >
          {wisdomCategories.map((c) => (
            <option key={c} value={c}>
              {wisdomCategoryLabels[c]}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Location (optional)"
        placeholder="Kunshan, Suzhou, Shanghai…"
        {...register("location")}
        error={errors.location?.message}
      />

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">The recommendation</span>
        <textarea
          rows={5}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          {...register("body")}
        />
        {errors.body ? <span className="mt-1 block text-xs text-danger">{errors.body.message}</span> : null}
      </label>

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Posting…" : "Share it"}
      </Button>
    </form>
  );
}
