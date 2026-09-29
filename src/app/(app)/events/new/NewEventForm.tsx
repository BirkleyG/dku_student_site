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
import { useRequestPushPrompt } from "@/components/notifications/PushPromptProvider";
import { DEFAULT_DURATION_MINUTES, DURATION_OPTIONS, toCampusDateTimeInput } from "@/lib/datetime";
import { useT } from "@/lib/i18n/client";

// Next whole hour, campus time.
function defaultStart(): string {
  const next = new Date(Math.ceil((Date.now() + 1) / 3_600_000) * 3_600_000);
  return toCampusDateTimeInput(next);
}

type EventFormValues = z.input<typeof eventSchema>;

export function NewEventForm({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const requestPushPrompt = useRequestPushPrompt();
  const t = useT("events");
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues, unknown, EventInput>({
    resolver: zodResolver(eventSchema),
    // The year (and date) start out as today in campus time; the start stays editable.
    defaultValues: {
      recurrence: "NONE",
      category: "SOCIAL_EVENTS",
      kind: "EVENT",
      allDay: false,
      durationMinutes: DEFAULT_DURATION_MINUTES,
      startsAt: defaultStart(),
    },
  });
  const allDay = useWatch({ control, name: "allDay" });
  const kind = useWatch({ control, name: "kind" });
  const switchAllDay = (next: boolean) => {
    const current = getValues("startsAt") || defaultStart();
    setValue("allDay", next);
    // Keep the chosen day when flipping between "date" and "date + time" inputs.
    setValue("startsAt", next ? current.slice(0, 10) : `${current.slice(0, 10)}T${current.slice(11, 16) || "09:00"}`);
  };
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
    // Fires before the navigation below; the prompt lives at the app root
    // (PushPromptProvider) so it stays on screen across the route change
    // instead of unmounting with this form.
    requestPushPrompt("event-created");
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

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("kindLabel")}</span>
        <select
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
          {...register("kind", {
            onChange: (e) => {
              // Deadlines and holidays never have a time; plain events can go either way.
              if (e.target.value !== "EVENT") switchAllDay(true);
            },
          })}
        >
          <option value="EVENT">{t("kindEvent")}</option>
          <option value="DEADLINE">{t("kindDeadline")}</option>
          <option value="HOLIDAY">{t("kindHoliday")}</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          className="h-4 w-4 accent-gold"
          checked={allDay}
          disabled={kind !== "EVENT"}
          onChange={(e) => switchAllDay(e.target.checked)}
        />
        {t("allDayLabel")}
      </label>

      <div className={allDay ? "" : "grid grid-cols-2 gap-4"}>
        {allDay ? (
          <Field
            key="date"
            label={t("dateLabel")}
            type="date"
            {...register("startsAt")}
            error={errors.startsAt?.message}
          />
        ) : (
          <>
            <Field
              key="datetime"
              label={t("startsLabel")}
              type="datetime-local"
              {...register("startsAt")}
              error={errors.startsAt?.message}
            />
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("durationLabel")}</span>
              <select
                className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
                {...register("durationMinutes", { valueAsNumber: true })}
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.minutes} value={o.minutes}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.durationMinutes ? <span className="mt-1 block text-xs text-danger">{errors.durationMinutes.message}</span> : null}
            </label>
          </>
        )}
      </div>
      <p className="-mt-3 text-xs text-ink/40">{allDay ? t("allDayHint") : t("timesInCampus")}</p>

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
