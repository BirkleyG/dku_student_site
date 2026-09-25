"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseCreateSchema, type CourseCreateInput } from "@/lib/course-validation";
import { DKU_DEPARTMENTS } from "@/lib/departments";
import type { CatalogCourse } from "@/lib/course-catalog";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CatalogPicker } from "@/components/courses/CatalogPicker";
import { useT } from "@/lib/i18n/client";

export function NewCourseForm() {
  const t = useT("courses");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CourseCreateInput>({ resolver: zodResolver(courseCreateSchema), defaultValues: { department: DKU_DEPARTMENTS[0] } });

  const department = useWatch({ control, name: "department" });
  const code = useWatch({ control, name: "code" });
  const title = useWatch({ control, name: "title" });

  const applyCatalogPick = (course: CatalogCourse) => {
    const dept = (DKU_DEPARTMENTS as readonly string[]).includes(course.department) ? course.department : "Other";
    setValue("department", dept as CourseCreateInput["department"]);
    if (dept === "Other") setValue("otherDepartment", course.department);
    setValue("code", course.code, { shouldValidate: true });
    setValue("title", course.title, { shouldValidate: true });
    setValue("credits", course.credits);
    setManual(true);
  };

  const onSubmit = async (data: CourseCreateInput) => {
    setServerError(null);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? t("couldntAddCourse"));
      return;
    }

    const { course } = await res.json();
    router.push(`/courses/${course.id}`);
  };

  return (
    <div className="space-y-5">
      {!manual ? (
        <>
          <CatalogPicker onPick={applyCatalogPick} />
          <button
            type="button"
            onClick={() => setManual(true)}
            className="focus-ring text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
          >
            {t("catalogCantFindIt")}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {code || title ? (
            <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {code} {title ? `· ${title}` : ""}
                </p>
                <p className="text-xs text-ink/50">{t("catalogFromOfficial")}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValue("code", "");
                  setValue("title", "");
                  setValue("credits", "");
                  setManual(false);
                }}
                className="focus-ring shrink-0 text-xs text-ink/45 underline decoration-ink/25 underline-offset-2 hover:text-ink"
              >
                {t("catalogSearchAgain")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setManual(false)}
              className="focus-ring text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
            >
              {t("catalogBackToSearch")}
            </button>
          )}

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("departmentLabel")}</span>
            <select
              className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
              {...register("department")}
            >
              {DKU_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          {department === "Other" ? (
            <Field
              label={t("whichDepartmentLabel")}
              placeholder={t("whichDepartmentPlaceholder")}
              {...register("otherDepartment")}
              error={errors.otherDepartment?.message}
            />
          ) : null}

          <Field label={t("courseCodeLabel")} placeholder={t("courseCodePlaceholder")} {...register("code")} error={errors.code?.message} />
          <Field label={t("titleLabel")} placeholder={t("titleFieldPlaceholder")} {...register("title")} error={errors.title?.message} />
          <Field label={t("creditsOptionalLabel")} placeholder="4" {...register("credits")} error={errors.credits?.message} />

          <p className="text-xs text-ink/40">{t("thatsItCourse")}</p>

          {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t("adding") : t("addCourse")}
          </Button>
        </form>
      )}
    </div>
  );
}
