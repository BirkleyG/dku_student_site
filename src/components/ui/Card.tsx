import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`group/card relative rounded-md border border-ink/12 bg-canvas p-5 transition-colors duration-150 hover:border-ink/25 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
