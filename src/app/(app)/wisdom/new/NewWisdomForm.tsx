"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { wisdomTopicSchema, wisdomCategories, wisdomCategoryLabels, type WisdomTopicInput } from "@/lib/wisdom-validation";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useT } from "@/lib/i18n/client";

export function NewWisdomForm() {
  const router = useRouter();
  const t = useT("wisdom");
  const [serverError, setServerError] = useState<string | null>(null);
  const [requireLocation, setRequireLocation] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WisdomTopicInput>({
    resolver: zodResolver(wisdomTopicSchema),
    defaultValues: { category: "FOOD", requireLocation: false },
  });

  const onSubmit = async (data: WisdomTopicInput) => {
    setServerError(null);
    const res = await fetch("/api/wisdom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, requireLocation }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? t("couldntStartTopic"));
      return;
    }

    const { topic } = await res.json();
    router.push(`/wisdom/${topic.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label={t("topicLabel")} placeholder={t("topicPlaceholder")} {...register("title")} error={errors.title?.message} />

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("categoryLabel")}</span>
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

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("contextLabel")}</span>
        <textarea
          rows={3}
          placeholder={t("contextPlaceholder")}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          {...register("description")}
        />
        {errors.description ? <span className="mt-1 block text-xs text-danger">{errors.description.message}</span> : null}
      </label>

      <div className="flex items-center justify-between rounded-xl border border-ink/15 bg-paper-dim px-4 py-3">
        <div>
          <p className="text-sm text-ink">{t("requireLocationLabel")}</p>
          <p className="text-xs text-ink/50">{t("requireLocationDescription")}</p>
        </div>
        <Switch checked={requireLocation} onChange={setRequireLocation} label={t("requireLocationLabel")} />
      </div>

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("starting") : t("startTheTopic")}
      </Button>
    </form>
  );
}
