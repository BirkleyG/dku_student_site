import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-3xl border border-paper/10 bg-surface/70 p-6 backdrop-blur-sm shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
