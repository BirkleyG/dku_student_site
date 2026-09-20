import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`group/card relative rounded-3xl border border-paper/10 bg-surface/70 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] backdrop-blur-sm transition-colors duration-300 hover:border-paper/20 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
