"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import {
  dearDkuCategories,
  dearDkuCategoryLabels,
  dearDkuSubmissionTypes,
  DEAR_DKU_BLANK_DOC_URL,
} from "@/lib/dear-dku-validation";
import { useT } from "@/lib/i18n/client";

type SubmissionType = (typeof dearDkuSubmissionTypes)[number];

export function NewDearDkuForm() {
  const router = useRouter();
  const t = useT("dearDku");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<(typeof dearDkuCategories)[number]>("OPINION");
  const [submissionType, setSubmissionType] = useState<SubmissionType>("GOOGLE_DOC");
  const [docUrl, setDocUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title.trim() || !summary.trim()) {
      setError(t("giveTitleAndSummary"));
      return;
    }
    if (submissionType === "GOOGLE_DOC" && !docUrl.trim()) {
      setError(t("pasteDocLink"));
      return;
    }
    if (submissionType === "FILE" && !fileUrl) {
      setError(t("uploadYourDocument"));
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/dear-dku", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, summary, category, submissionType, docUrl, fileUrl }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      setError(errBody.error ?? t("couldntPublish"));
      setSubmitting(false);
      return;
    }

    const { post } = await res.json();
    router.push(`/dear-dku/${post.id}`);
  };

  return (
    <div className="space-y-5">
      <Field
        label={t("titleLabel")}
        placeholder={t("titlePlaceholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("summaryLabel")}</span>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={t("summaryPlaceholder")}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("categoryLabel")}</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as (typeof dearDkuCategories)[number])}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
        >
          {dearDkuCategories.map((c) => (
            <option key={c} value={c}>
              {dearDkuCategoryLabels[c]}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("howToShareLabel")}</span>
        <div className="flex gap-2">
          {dearDkuSubmissionTypes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSubmissionType(option)}
              className={`focus-ring flex-1 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                submissionType === option ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/50 hover:border-ink/35"
              }`}
            >
              {option === "GOOGLE_DOC" ? t("googleDocOption") : t("uploadFileOption")}
            </button>
          ))}
        </div>
      </div>

      {submissionType === "GOOGLE_DOC" ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-ink/10 bg-paper-dim p-4 text-sm text-ink/65">
            <p className="font-medium text-ink/80">{t("commentOnlyHeading")}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>{t("commentOnlyStep1")}</li>
              <li>{t("commentOnlyStep2")}</li>
              <li>{t("commentOnlyStep3")}</li>
            </ol>
            <a
              href={DEAR_DKU_BLANK_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
            >
              {t("openBlankDoc")}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <Field
            label={t("docLinkLabel")}
            placeholder={t("docLinkPlaceholder")}
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
        </div>
      ) : (
        <div>
          <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{t("fileLabel")}</span>
          <DocumentUpload value={fileUrl || undefined} onChange={setFileUrl} />
        </div>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button onClick={submit} disabled={submitting} className="w-full">
        {submitting ? t("publishing") : t("publishButton")}
      </Button>
    </div>
  );
}
