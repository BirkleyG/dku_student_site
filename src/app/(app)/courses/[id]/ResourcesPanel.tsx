"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { SemesterPicker } from "@/components/ui/SemesterPicker";
import {
  courseExamTypeLabels,
  courseExamTypes,
  courseResourceTypes,
  courseResourceTypeLabels,
  courseShareTypes,
} from "@/lib/course-validation";
import { useT } from "@/lib/i18n/client";

type ApiResource = {
  id: string;
  type: (typeof courseResourceTypes)[number];
  title: string;
  semester: string | null;
  body: string | null;
  fileUrl: string | null;
  fileName: string | null;
  examType: (typeof courseExamTypes)[number] | null;
  professor: { id: string; firstName: string; lastName: string } | null;
  authorId: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
};

type ProfessorOption = { id: string; firstName: string; lastName: string };

type ShareType = (typeof courseShareTypes)[number];

type ShareForm = {
  type: ShareType;
  professorId: string;
  semester: string;
  examType: string;
  title: string;
  body: string;
  fileUrl: string;
  fileName: string;
};

const emptyForm = (type: ShareType): ShareForm => ({
  type,
  professorId: "",
  semester: "",
  examType: "",
  title: "",
  body: "",
  fileUrl: "",
  fileName: "",
});

const inputClass =
  "focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold";

const SHARE_TYPE_KEYS = {
  SYLLABUS: "shareTypeSyllabus",
  MATERIALS: "shareTypeMaterials",
  EXAM: "shareTypeExam",
} as const;

const EXAM_TYPE_KEYS = {
  MIDTERM: "examTypeMidterm",
  FINAL: "examTypeFinal",
  OTHER: "examTypeOther",
} as const;

export function ResourcesPanel({
  courseId,
  currentUserId,
  canManage,
  professors,
  isAdmin,
  initialResources,
}: {
  courseId: string;
  currentUserId: string | null;
  canManage: boolean;
  professors: ProfessorOption[];
  isAdmin: boolean;
  initialResources: ApiResource[];
}) {
  const t = useT("courses");
  const [resources, setResources] = useState(initialResources);
  const [filter, setFilter] = useState<(typeof courseResourceTypes)[number] | "ALL">("ALL");
  const [form, setForm] = useState<ShareForm>(emptyForm("SYLLABUS"));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NOTES / TIP can't be posted anymore, but old ones stay browsable.
  const filterTypes = courseResourceTypes.filter(
    (type) => (courseShareTypes as readonly string[]).includes(type) || resources.some((r) => r.type === type),
  );
  const visible = filter === "ALL" ? resources : resources.filter((r) => r.type === filter);

  const submit = async () => {
    setError(null);
    if (form.type !== "MATERIALS") {
      if (!form.professorId) return setError(t("errPickProfessor"));
      if (form.type === "SYLLABUS" && !/ \d{4}$/.test(form.semester)) return setError(t("errPickSemester"));
      if (form.type === "EXAM" && !form.examType) return setError(t("errPickExamType"));
    } else if (form.title.trim().length < 2) {
      return setError(t("errSayWhatItIs"));
    }
    if (!form.fileUrl) return setError(t("errAttachFile"));

    const payload =
      form.type === "SYLLABUS"
        ? { type: form.type, professorId: form.professorId, semester: form.semester }
        : form.type === "EXAM"
          ? { type: form.type, professorId: form.professorId, examType: form.examType }
          : { type: form.type, title: form.title, body: form.body };

    setSubmitting(true);
    const res = await fetch(`/api/courses/${courseId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, fileUrl: form.fileUrl, fileName: form.fileName }),
    }).catch(() => null);
    if (!res || !res.ok) {
      const body = (await res?.json().catch(() => ({}))) ?? {};
      setError(body.error ?? t("couldntAdd"));
      setSubmitting(false);
      return;
    }
    const { resource } = await res.json();
    setResources((prev) => [resource, ...prev]);
    setForm(emptyForm(form.type));
    setSubmitting(false);
  };

  const remove = async (id: string) => {
    if (!window.confirm(t("confirmRemoveResource"))) return;
    const res = await fetch(`/api/courses/${courseId}/resources/${id}`, { method: "DELETE" });
    if (res.ok) setResources((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl">{t("sharedByStudentsHeading")}</h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          {t("allFilter")}
        </FilterChip>
        {filterTypes.map((type) => (
          <FilterChip key={type} active={filter === type} onClick={() => setFilter(type)}>
            {courseResourceTypeLabels[type]}
          </FilterChip>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {visible.length === 0 ? (
          <p className="text-sm text-ink/40">{t("resourcesEmptyState")}</p>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="rounded-2xl bg-paper-dim p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
                      {courseResourceTypeLabels[r.type]}
                    </span>
                    {r.examType ? (
                      <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-medium text-ink/70">
                        {courseExamTypeLabels[r.examType]}
                      </span>
                    ) : null}
                    {r.semester ? <span className="text-xs text-ink/45">{r.semester}</span> : null}
                  </div>
                  <p className="mt-1.5 font-medium text-ink">{r.title}</p>
                  {r.professor ? (
                    <Link
                      href={`/professors/${r.professor.id}`}
                      className="focus-ring mt-0.5 inline-block text-sm text-ink/60 underline decoration-ink/25 underline-offset-2 hover:text-ink"
                    >
                      {r.professor.firstName} {r.professor.lastName}
                    </Link>
                  ) : null}
                  {r.body ? <p className="mt-1 whitespace-pre-wrap text-sm text-ink/70">{r.body}</p> : null}
                  {r.fileUrl ? (
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring mt-2 inline-flex items-center gap-1.5 text-xs text-ink/60 underline decoration-ink/25 underline-offset-2 hover:text-ink"
                    >
                      <FileText className="h-3.5 w-3.5" /> {r.fileName ?? t("openFileLink")}
                    </a>
                  ) : null}
                  <p className="mt-2 text-xs text-ink/40">
                    {r.author.firstName} {r.author.lastName} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {isAdmin || r.authorId === currentUserId ? (
                  <button
                    onClick={() => remove(r.id)}
                    className="focus-ring shrink-0 text-ink/30 transition-colors hover:text-danger"
                    aria-label={t("removeResourceAria")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {canManage ? (
        <div className="mt-6 space-y-3 rounded-2xl border border-ink/10 bg-paper-dim/60 p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/60">{t("shareSomethingHeading")}</p>
          <select
            value={form.type}
            onChange={(e) => {
              setError(null);
              setForm(emptyForm(e.target.value as ShareType));
            }}
            className={inputClass}
          >
            {courseShareTypes.map((type) => (
              <option key={type} value={type}>
                {t(SHARE_TYPE_KEYS[type])}
              </option>
            ))}
          </select>

          {form.type === "MATERIALS" ? (
            <>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t("materialTitlePlaceholder")}
                maxLength={160}
                className={inputClass}
              />
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder={t("materialDescriptionPlaceholder")}
                rows={3}
                className={inputClass}
              />
            </>
          ) : (
            <>
              <select
                value={form.professorId}
                onChange={(e) => setForm((f) => ({ ...f, professorId: e.target.value }))}
                className={inputClass}
              >
                <option value="">{t("professorSelectPlaceholder")}</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              <Link
                href="/professors/new"
                className="focus-ring block text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
              >
                {t("professorNotListed")}
              </Link>
              {form.type === "SYLLABUS" ? (
                <SemesterPicker
                  value={form.semester}
                  onChange={(semester) => setForm((f) => ({ ...f, semester }))}
                  optionalLabel={t("sessionYearHeading")}
                />
              ) : (
                <select
                  value={form.examType}
                  onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">{t("examTypeSelectPlaceholder")}</option>
                  {courseExamTypes.map((type) => (
                    <option key={type} value={type}>
                      {t(EXAM_TYPE_KEYS[type])}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          <DocumentUpload
            value={form.fileUrl || undefined}
            onChange={(fileUrl, fileName) => setForm((f) => ({ ...f, fileUrl, fileName: fileName ?? "" }))}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? t("sharing") : t("share")}
          </Button>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink/40">{t("logInToShare")}</p>
      )}
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/50 hover:border-ink/35"
      }`}
    >
      {children}
    </button>
  );
}
