import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { widgetCatalog } from "@/lib/widgets";
import type { WidgetType } from "@prisma/client";

export function WidgetCard({ type, children }: { type: WidgetType; children?: ReactNode }) {
  const meta = widgetCatalog[type];
  const Icon = meta.icon;
  return (
    <Card className="flex h-full flex-col transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-gold/25 to-sprout/30 text-ink">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h3 className="mt-3 font-display text-2xl">{meta.label}</h3>
          <p className="mt-1 text-sm text-ink/55">{meta.blurb}</p>
        </div>
      </div>

      <div className="mt-4 flex-1">{children}</div>

      <Link
        href={meta.href}
        className="focus-ring group mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-bright"
      >
        Open {meta.label}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </Card>
  );
}
