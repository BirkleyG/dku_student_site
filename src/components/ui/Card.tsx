import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`group/card relative rounded-lg border border-ink/10 bg-paper p-6 transition-colors duration-300 hover:border-ink/20 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
