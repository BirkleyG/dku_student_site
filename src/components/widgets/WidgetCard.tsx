import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { widgetCatalog } from "@/lib/widgets";
import type { WidgetType } from "@prisma/client";

export function WidgetCard({ type, children }: { type: WidgetType; children?: ReactNode }) {
  const meta = widgetCatalog[type];
  return (
    <Card className="flex h-full flex-col transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-2xl">{meta.emoji}</span>
          <h3 className="mt-2 font-display text-xl">{meta.label}</h3>
          <p className="mt-1 text-sm text-paper/55">{meta.blurb}</p>
        </div>
      </div>

      <div className="mt-4 flex-1">{children}</div>

      <Link
        href={meta.href}
        className="focus-ring mt-5 inline-flex w-fit items-center gap-1 text-sm font-medium text-gold hover:text-gold-bright"
      >
        Open {meta.label} →
      </Link>
    </Card>
  );
}
