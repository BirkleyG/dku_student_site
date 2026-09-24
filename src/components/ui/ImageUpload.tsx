"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/uploads";

const MAX_DIMENSION = 1600;

/** Shrinks big photos in the browser so uploads stay fast and small. GIFs pass through to keep animation. */
async function downscale(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 800 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  return blob ?? file;
}

type Props = {
  label: string;
  value: string | undefined;
  onChange: (url: string) => void;
  error?: string;
};

export function ImageUpload({ label, value, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setUploadError("Use a JPG, PNG, WebP, or GIF.");
      return;
    }
    setUploading(true);
    try {
      const blob = await downscale(file);
      if (blob.size > MAX_UPLOAD_BYTES) {
        setUploadError("That image is too big. Try one under 3MB.");
        return;
      }
      const body = new FormData();
      const ext = blob.type.split("/")[1] ?? "img";
      body.append("file", new File([blob], `poster.${ext}`, { type: blob.type }));
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setUploadError(data.error ?? "Upload failed. Try again.");
        return;
      }
      onChange(data.url);
    } catch {
      setUploadError("Couldn't read that image. Try a different file.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const shownError = uploadError ?? error;

  return (
    <div>
      <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-ink/15 bg-paper-dim">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Poster preview" className="max-h-72 w-full object-contain" />
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="focus-ring rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm hover:bg-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove poster"
              className="focus-ring rounded-full bg-white/90 p-1.5 text-ink shadow-sm hover:bg-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="focus-ring flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/25 bg-paper-dim px-4 py-8 text-sm text-ink/60 transition-colors hover:border-gold hover:text-ink disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          {uploading ? "Uploading…" : "Click or drop an image"}
        </button>
      )}
      {shownError ? <span className="mt-1 block text-xs text-danger">{shownError}</span> : null}
    </div>
  );
}
