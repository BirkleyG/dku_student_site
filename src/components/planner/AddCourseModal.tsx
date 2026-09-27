"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { CatalogPicker } from "@/components/courses/CatalogPicker";
import type { CatalogCourse } from "@/lib/course-catalog";
import { GEN_ED_TAG_LABELS } from "@/lib/planner-progress";

export type NewCourseInput = {
  code: string;
  title: string;
  credits: string;
  isCrNc: boolean;
  genEdTags: string[];
};

export function AddCourseModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: NewCourseInput) => void;
}) {
  const t = useT("planner");
  const [tab, setTab] = useState<"catalog" | "manual">("catalog");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState("4");
  const [isCrNc, setIsCrNc] = useState(false);
  const [genEdTags, setGenEdTags] = useState<string[]>([]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-ink/10 bg-paper p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">{t("addCourse")}</h3>
          <button onClick={onClose} className="focus-ring text-ink/40 hover:text-ink" aria-label={t("cancel")}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-2 text-xs font-medium">
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

        {tab === "catalog" ? (
          <div className="mt-4">
            <CatalogPicker onPick={pick} />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
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

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="focus-ring rounded-full px-4 py-2 text-sm text-ink/60">
                {t("cancel")}
              </button>
              <button onClick={save} className="focus-ring rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-bright">
                {t("saveCourse")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
