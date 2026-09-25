"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { eventSchema, type EventInput } from "@/lib/event-validation";
import { EVENT_CATEGORY_GROUPS } from "@/lib/event-categories";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useT } from "@/lib/i18n/client";

type EventFormValues = z.input<typeof eventSchema>;

export function NewEventForm({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const t = useT("events");
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues, unknown, EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: { recurrence: "NONE", category: "SOCIAL_EVENTS" },
  });
  const posterUrl = useWatch({ control, name: "posterUrl" });

  const onSubmit = async (data: EventInput) => {
    setServerError(null);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? t("couldntCreateEvent"));
      return;
    }

    const { event } = await res.json();
    router.push(`/events/${event.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label={t("titleLabel")} {...register("title")} error={errors.title?.message} />

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("descriptionLabel")}</span>
        <textarea
          rows={4}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          {...register("description")}
        />
        {errors.description ? <span className="mt-1 block text-xs text-danger">{errors.description.message}</span> : null}
      </label>

      <Field label={t("locationLabel")} {...register("location")} error={errors.location?.message} />
      <ImageUpload
        label={t("posterLabel")}
        value={posterUrl}
        onChange={(url) => setValue("posterUrl", url, { shouldValidate: true })}
        error={errors.posterUrl?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("startsLabel")} type="datetime-local" {...register("startsAt")} error={errors.startsAt?.message} />
        <Field label={t("endsLabel")} type="datetime-local" {...register("endsAt")} error={errors.endsAt?.message} />
      </div>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("categoryLabel")}</span>
        <select
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
          {...register("category")}
        >
          {EVENT_CATEGORY_GROUPS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.categories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors.category ? <span className="mt-1 block text-xs text-danger">{errors.category.message}</span> : null}
      </label>

      {isAdmin ? (
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("repeatsLabel")}</span>
          <select
            className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
            {...register("recurrence")}
          >
            <option value="NONE">{t("doesntRepeat")}</option>
            <option value="DAILY">{t("daily")}</option>
            <option value="WEEKLY">{t("weekly")}</option>
            <option value="MONTHLY">{t("monthly")}</option>
          </select>
        </label>
      ) : (
        <p className="text-xs text-ink/40">
          {t("recurringNote")}
        </p>
      )}

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("publishing") : t("publishEvent")}
      </Button>
    </form>
  );
}
