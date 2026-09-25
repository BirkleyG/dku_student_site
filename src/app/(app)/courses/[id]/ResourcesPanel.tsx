"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { courseResourceTypes, courseResourceTypeLabels, type CourseResourceInput } from "@/lib/course-validation";
import { useT } from "@/lib/i18n/client";

type ApiResource = {
  id: string;
  type: (typeof courseResourceTypes)[number];
  title: string;
  semester: string | null;
  body: string | null;
  fileUrl: string | null;
  authorId: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
};

export function ResourcesPanel({
  courseId,
  currentUserId,
  canManage,
  isAdmin,
  initialResources,
}: {
  courseId: string;
  currentUserId: string | null;
  canManage: boolean;
  isAdmin: boolean;
  initialResources: ApiResource[];
}) {
  const t = useT("courses");
  const [resources, setResources] = useState(initialResources);
  const [filter, setFilter] = useState<(typeof courseResourceTypes)[number] | "ALL">("ALL");
  const [form, setForm] = useState<Partial<CourseResourceInput>>({ type: "NOTES" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = filter === "ALL" ? resources : resources.filter((r) => r.type === filter);

  const submit = async () => {
    setError(null);
    if (!form.title?.trim()) {
      setError(t("errGiveTitle"));
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/courses/${courseId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: form.type ?? "NOTES", title: form.title, semester: form.semester ?? "", body: form.body ?? "", fileUrl: form.fileUrl ?? "" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t("couldntAdd"));
      setSubmitting(false);
      return;
    }
    const { resource } = await res.json();
    setResources((prev) => [resource, ...prev]);
    setForm({ type: form.type });
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
        {courseResourceTypes.map((t) => (
          <FilterChip key={t} active={filter === t} onClick={() => setFilter(t)}>
            {courseResourceTypeLabels[t]}
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
                    {r.semester ? <span className="text-xs text-ink/45">{r.semester}</span> : null}
                  </div>
                  <p className="mt-1.5 font-medium text-ink">{r.title}</p>
                  {r.body ? <p className="mt-1 whitespace-pre-wrap text-sm text-ink/70">{r.body}</p> : null}
                  {r.fileUrl ? (
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring mt-2 inline-flex items-center gap-1.5 text-xs text-ink/60 underline decoration-ink/25 underline-offset-2 hover:text-ink"
                    >
                      <LinkIcon className="h-3.5 w-3.5" /> {t("openFileLink")}
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
            value={form.type ?? "NOTES"}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CourseResourceInput["type"] }))}
            className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink focus:border-gold"
          >
            {courseResourceTypes.map((t) => (
              <option key={t} value={t}>
                {courseResourceTypeLabels[t]}
              </option>
            ))}
          </select>
          <input
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t("titlePlaceholder")}
            className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          />
          <input
            value={form.semester ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
            placeholder={t("semesterPlaceholder")}
            className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          />
          <textarea
            value={form.body ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder={t("notesPlaceholder")}
            rows={3}
            className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          />
          <DocumentUpload value={form.fileUrl} onChange={(url) => setForm((f) => ({ ...f, fileUrl: url }))} />
          {!form.fileUrl ? (
            <input
              value={form.fileUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
              placeholder={t("fileLinkOrPastePlaceholder")}
              className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
            />
          ) : null}
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
