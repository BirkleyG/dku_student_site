import type { WidgetInstance } from "@/lib/widgets";
import { widgetCatalog } from "@/lib/widgets";
import { AppWidgetContent, type WidgetData } from "./AppWidgetContent";

/** Presentational-only tile face — shared by the live sortable tile and the DragOverlay clone. */
export function WidgetTileCard({
  instance,
  data,
  jiggle = false,
  jiggleIndex = 0,
  className = "",
}: {
  instance: WidgetInstance;
  data: WidgetData;
  jiggle?: boolean;
  jiggleIndex?: number;
  className?: string;
}) {
  const meta = widgetCatalog[instance.kind];
  const Icon = meta.icon;

  return (
    <div
      style={jiggle ? ({ "--jiggle-delay": `${(jiggleIndex % 4) * 65}ms` } as React.CSSProperties) : undefined}
      className={`flex h-full w-full flex-col rounded-lg border border-ink/10 bg-paper p-4 ${
        jiggle ? "animate-jiggle" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold/25 to-sprout/30 text-ink">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <h3 className="truncate text-sm font-medium text-ink">{meta.label}</h3>
        {meta.eatsData && !data.eats.live ? (
          <span className="shrink-0 rounded-full bg-ink/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ink/40">Sample</span>
        ) : null}
      </div>

      <div className="mt-3 min-w-0 flex-1 overflow-hidden">
        <AppWidgetContent instance={instance} data={data} />
      </div>
    </div>
  );
}
