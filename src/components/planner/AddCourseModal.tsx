"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { CatalogPicker } from "@/components/courses/CatalogPicker";
import type { CatalogCourse } from "@/lib/course-catalog";
import { DKU_COURSE_CATALOG } from "@/lib/course-catalog";
import { GEN_ED_TAG_LABELS } from "@/lib/planner-progress";
import { getMajorRequirements, type RequirementUnit } from "@/lib/major-requirements";

export type NewCourseInput = {
  code: string;
  title: string;
  credits: string;
  isCrNc: boolean;
  genEdTags: string[];
};

export type EditingCourse = NewCourseInput & { id: string };

const REQUIREMENT_CATEGORIES = ["divisionalFoundation", "interdisciplinary", "disciplinary", "electives"] as const;

function catalogLookup(code: string): CatalogCourse | undefined {
  const normalized = code.trim().toUpperCase();
  return DKU_COURSE_CATALOG.find((c) => c.code.toUpperCase() === normalized || c.crossListed.some((cl) => cl.toUpperCase() === normalized));
}

export function AddCourseModal({
  major,
  track,
  placedCodes,
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  major?: string | null;
  track?: string | null;
  placedCodes?: string[];
  editing?: EditingCourse;
  onClose: () => void;
  onSave: (input: NewCourseInput) => void;
  onDelete?: () => void;
}) {
  const t = useT("planner");
  const requirements = major ? getMajorRequirements(major, track ?? null) : undefined;
  const hasRequirements = requirements && Object.values(requirements.categories).some((units) => (units?.length ?? 0) > 0);

  const [tab, setTab] = useState<"requirements" | "catalog" | "manual">(editing ? "manual" : hasRequirements ? "requirements" : "catalog");
  const [reqCategory, setReqCategory] = useState<(typeof REQUIREMENT_CATEGORIES)[number]>(REQUIREMENT_CATEGORIES[0]);
  const [code, setCode] = useState(editing?.code ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [credits, setCredits] = useState(editing?.credits ?? "4");
  const [isCrNc, setIsCrNc] = useState(editing?.isCrNc ?? false);
  const [genEdTags, setGenEdTags] = useState<string[]>(editing?.genEdTags ?? []);

  const fillFrom = (unitCode: string) => {
    const match = catalogLookup(unitCode);
    setCode(unitCode.toUpperCase());
    setTitle(match?.title ?? "");
    setCredits(match?.credits ?? "4");
    setTab("manual");
  };

  const pick = (course: CatalogCourse) => {
    setCode(course.code);
    setTitle(course.title);
    setCredits(course.credits);
    setTab("manual");
  };

  const toggleTag = (tag: string) => {
    setGenEdTags((prev) => (prev.includes(tag) ? prev.filter((t2) => t2 !== tag) : [...prev, tag]));
  };

  const save = () => {
    if (!code.trim()) return;
    onSave({ code: code.trim().toUpperCase(), title: title.trim(), credits: credits.trim(), isCrNc, genEdTags });
  };

  const isPlaced = (unitCode: string) => (placedCodes ?? []).includes(unitCode.trim().toUpperCase());

  const renderUnit = (unit: RequirementUnit, key: string) => {
    if (unit.type === "single") {
      const unitCode = unit.codes[0];
      const match = catalogLookup(unitCode);
      const placed = unit.codes.some(isPlaced);
      return (
        <button
          key={key}
          type="button"
          onClick={() => fillFrom(unitCode)}
          className="focus-ring flex w-full items-start justify-between gap-3 rounded-xl border border-ink/10 px-3 py-2.5 text-left transition-colors hover:border-gold hover:bg-gold/10"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
              {placed ? <Check className="h-3.5 w-3.5 shrink-0 text-sprout-deep" /> : null}
              {unit.codes.join(" / ")}
            </span>
            {match ? <span className="block truncate text-xs text-ink/50">{match.title}</span> : null}
          </span>
          {match ? <span className="shrink-0 text-xs text-ink/40">{match.credits} cr</span> : null}
        </button>
      );
    }
    return (
      <div key={key} className="rounded-xl border border-dashed border-ink/15 p-2.5">
        <p className="px-1 text-[11px] uppercase tracking-[0.12em] text-ink/40">{t("chooseOneOf")}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {unit.options.map((option) => {
            const unitCode = option[0];
            const placed = option.some(isPlaced);
            return (
              <button
                key={option.join("/")}
                type="button"
                onClick={() => fillFrom(unitCode)}
                className="focus-ring flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/80 hover:border-gold hover:bg-gold/10"
              >
                {placed ? <Check className="h-3 w-3 text-sprout-deep" /> : null}
                {option.join(" / ")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-ink/10 bg-paper p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">{editing ? t("editCourse") : t("addCourse")}</h3>
          <button onClick={onClose} className="focus-ring text-ink/40 hover:text-ink" aria-label={t("cancel")}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {!editing ? (
          <div className="mt-4 flex gap-2 text-xs font-medium">
            {hasRequirements ? (
              <button
                type="button"
                onClick={() => setTab("requirements")}
                className={`rounded-full px-3 py-1.5 ${tab === "requirements" ? "bg-ink text-white" : "bg-paper-dim text-ink/60"}`}
              >
                {t("requirementsTab")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setTab("catalog")}
              className={`rounded-full px-3 py-1.5 ${tab === "catalog" ? "bg-ink text-white" : "bg-paper-dim text-ink/60"}`}
            >
              {t("catalogTab")}
            </button>
            <button
              type="button"
              onClick={() => setTab("manual")}
              className={`rounded-full px-3 py-1.5 ${tab === "manual" ? "bg-ink text-white" : "bg-paper-dim text-ink/60"}`}
            >
              {t("manualEntryTab")}
            </button>
          </div>
        ) : null}

        {tab === "requirements" && requirements ? (
          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap gap-1.5">
              {REQUIREMENT_CATEGORIES.filter((c) => (requirements.categories[c]?.length ?? 0) > 0).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setReqCategory(c)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    reqCategory === c ? "border-gold bg-gold/20 text-ink" : "border-ink/15 text-ink/55"
                  }`}
                >
                  {t(`category_${c}`)}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 overflow-y-auto pr-1">
              {(requirements.categories[reqCategory] ?? []).map((unit, i) => renderUnit(unit, `${reqCategory}-${i}`))}
            </div>
          </div>
        ) : null}

        {tab === "catalog" ? (
          <div className="mt-4">
            <CatalogPicker onPick={pick} />
          </div>
        ) : null}

        {tab === "manual" ? (
          <div className="mt-4 space-y-3 overflow-y-auto pr-1">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("courseCodeLabel")}
              className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("courseTitleLabel")}
              className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm"
            />
            <input
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder={t("creditsFieldLabel")}
              className="focus-ring w-24 rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" checked={isCrNc} onChange={(e) => setIsCrNc(e.target.checked)} />
              {t("crNcLabel")}
            </label>

            <div>
              <p className="text-xs font-medium text-ink/55">{t("genEdTagsLabel")}</p>
              <p className="text-[11px] text-ink/40">{t("genEdTagsHint")}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {Object.entries(GEN_ED_TAG_LABELS).map(([tag, label]) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-2 py-1 text-[11px] ${
                      genEdTags.includes(tag) ? "border-gold bg-gold/20 text-ink" : "border-ink/15 text-ink/55"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              {editing && onDelete ? (
                <button onClick={onDelete} className="focus-ring rounded-full px-4 py-2 text-sm text-danger">
                  {t("removeCourse")}
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button onClick={onClose} className="focus-ring rounded-full px-4 py-2 text-sm text-ink/60">
                  {t("cancel")}
                </button>
                <button onClick={save} className="focus-ring rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-bright">
                  {t("saveCourse")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
