"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES } from "@/lib/uploads";

type Props = {
  value: string | undefined;
  onChange: (url: string) => void;
  fileName?: string;
};

/** Uploads a PDF/Word/PowerPoint/text file and hands back its /api/uploads URL — the doc equivalent of ImageUpload. */
export function DocumentUpload({ value, onChange, fileName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [name, setName] = useState(fileName);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
      setUploadError("Use a PDF, Word, PowerPoint, or plain text file.");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setUploadError(`That file is too big. Try one under ${Math.floor(MAX_DOCUMENT_BYTES / (1024 * 1024))}MB.`);
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("kind", "document");
      body.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setUploadError(data.error ?? "Upload failed. Try again.");
        return;
      }
      setName(file.name);
      onChange(data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_DOCUMENT_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-ink/15 bg-paper px-4 py-3">
          <span className="min-w-0 truncate text-sm text-ink/75">{name ?? "File attached"}</span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setName(undefined);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="focus-ring shrink-0 text-ink/40 hover:text-danger"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 px-4 py-3 text-sm text-ink/60 transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload a file (PDF, Word, PowerPoint…)"}
        </button>
      )}
      {uploadError ? <p className="mt-1.5 text-xs text-danger">{uploadError}</p> : null}
    </div>
  );
}
