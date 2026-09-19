import type { InputHTMLAttributes } from "react";

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-paper/60">{label}</span>
      <input
        className="focus-ring w-full rounded-xl border border-paper/15 bg-ink-soft px-4 py-3 text-paper placeholder:text-paper/30 transition-colors focus:border-gold"
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}
