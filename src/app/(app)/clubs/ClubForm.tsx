"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import {
  clubSchema,
  groupTypes,
  groupTypeLabels,
  clubCategories,
  clubCategoryLabels,
  athleticKinds,
  athleticKindLabels,
  contactMethods,
  contactMethodLabels,
  type ClubInput,
} from "@/lib/club-validation";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Switch } from "@/components/ui/Switch";
import { useT } from "@/lib/i18n/client";

const selectClass =
  "focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold";
const labelClass = "mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60";

export function ClubForm({
  mode,
  clubId,
  defaultValues,
}: {
  mode: "create" | "edit";
  clubId?: string;
  defaultValues?: Partial<ClubInput>;
}) {
  const t = useT("clubs");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClubInput>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      type: "CLUB",
      category: "SOCIAL",
      contactMethod: "EMAIL",
      openJoin: true,
      officers: [{ name: "", title: "President", contact: "" }],
      ...defaultValues,
    },
  });

  const type = useWatch({ control, name: "type" });
  const category = useWatch({ control, name: "category" });
  const contactMethod = useWatch({ control, name: "contactMethod" });
  const openJoin = useWatch({ control, name: "openJoin" });
  const logoUrl = useWatch({ control, name: "logoUrl" });
  const contactQrUrl = useWatch({ control, name: "contactQrUrl" });
  const officers = useWatch({ control, name: "officers" }) ?? [];

  const onSubmit = async (data: ClubInput) => {
    setServerError(null);
    const res = await fetch(mode === "create" ? "/api/clubs" : `/api/clubs/${clubId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? t("couldntSave"));
      return;
    }

    const body = await res.json();
    router.push(`/clubs/${body.club.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <label className="block">
        <span className={labelClass}>{t("typeQuestion")}</span>
        <select className={selectClass} {...register("type")}>
          {groupTypes.map((gt) => (
            <option key={gt} value={gt}>
              {groupTypeLabels[gt]}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-ink/40">
          {t("typeHint")}
        </span>
      </label>

      <Field label={t("nameLabel")} {...register("name")} error={errors.name?.message} />

      <label className="block">
        <span className={labelClass}>{t("categoryLabel")}</span>
        <select className={selectClass} {...register("category")}>
          {clubCategories.map((c) => (
            <option key={c} value={c}>
              {clubCategoryLabels[c]}
            </option>
          ))}
        </select>
      </label>

      {category === "ATHLETIC" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>{t("athleticKindQuestion")}</span>
            <select className={selectClass} {...register("athleticKind")}>
              {athleticKinds.map((k) => (
                <option key={k} value={k}>
                  {athleticKindLabels[k]}
                </option>
              ))}
            </select>
            {errors.athleticKind ? (
              <span className="mt-1 block text-xs text-danger">{errors.athleticKind.message}</span>
            ) : null}
          </label>
          <Field label={t("sportLabel")} placeholder={t("sportPlaceholder")} {...register("sportName")} />
        </div>
      ) : null}

      <label className="block">
        <span className={labelClass}>{t("descriptionLabel")}</span>
        <textarea
          rows={4}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          {...register("description")}
        />
        {errors.description ? (
          <span className="mt-1 block text-xs text-danger">{errors.description.message}</span>
        ) : null}
      </label>

      <div className="rounded-2xl border border-ink/10 p-4">
        <p className="text-sm font-medium text-ink">{t("leadershipHeading")}</p>
        <p className="mt-1 text-xs text-ink/50">{t("leadershipHint")}</p>
        <div className="mt-4 space-y-3">
          {officers.map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <input
                className="focus-ring rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-gold"
                placeholder={t("officerNamePlaceholder")}
                {...register(`officers.${i}.name` as const)}
              />
              <input
                className="focus-ring rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-gold"
                placeholder={t("officerTitlePlaceholder")}
                {...register(`officers.${i}.title` as const)}
              />
              <input
                className="focus-ring rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-gold"
                placeholder={t("officerContactPlaceholder")}
                {...register(`officers.${i}.contact` as const)}
              />
              <button
                type="button"
                onClick={() =>
                  setValue(
                    "officers",
                    officers.filter((_, j) => j !== i),
                  )
                }
                className="focus-ring rounded-full p-2 text-ink/40 hover:text-danger"
                aria-label={t("removeOfficerAria")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setValue("officers", [...officers, { name: "", title: "", contact: "" }])}
          className="focus-ring mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" /> {t("addAnotherLeader")}
        </button>
      </div>

      <label className="block">
        <span className={labelClass}>
          {t("contactQuestion", { who: type === "ORGANIZATION" ? t("contactWhoYou") : t("contactWhoClub") })}
        </span>
        <select className={selectClass} {...register("contactMethod")}>
          {contactMethods.map((m) => (
            <option key={m} value={m}>
              {contactMethodLabels[m]}
            </option>
          ))}
        </select>
      </label>

      {contactMethod === "WECHAT" ? (
        <Controller
          control={control}
          name="contactQrUrl"
          render={({ field }) => (
            <ImageUpload
              label={t("wechatQrLabel")}
              value={contactQrUrl || undefined}
              onChange={field.onChange}
              error={errors.contactQrUrl?.message}
            />
          )}
        />
      ) : (
        <Field
          label={contactMethod === "EMAIL" ? t("emailLabel") : contactMethod === "PHONE" ? t("phoneLabel") : t("contactInfoLabel")}
          {...register("contactValue")}
          error={errors.contactValue?.message}
        />
      )}

      <Field label={t("websiteLabel")} placeholder="https://…" {...register("website")} error={errors.website?.message} />

      <Controller
        control={control}
        name="logoUrl"
        render={({ field }) => (
          <ImageUpload label={t("logoLabel")} value={logoUrl || undefined} onChange={field.onChange} error={errors.logoUrl?.message} />
        )}
      />

      <div className="flex items-center justify-between rounded-2xl border border-ink/10 p-4">
        <div>
          <p className="text-sm font-medium text-ink">{t("anyoneCanJoinTitle")}</p>
          <p className="mt-0.5 text-xs text-ink/50">
            {t("anyoneCanJoinHint")}
          </p>
        </div>
        <Controller
          control={control}
          name="openJoin"
          render={({ field }) => <Switch checked={openJoin} onChange={field.onChange} label={t("openJoinSwitchLabel")} />}
        />
      </div>

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("saving") : mode === "create" ? t("addClub") : t("saveChanges")}
      </Button>
    </form>
  );
}
