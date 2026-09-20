"use client";

import Link from "next/link";
import { X, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { appCatalog, sizeSpec, type WidgetApp, type WidgetSize } from "@/lib/widgets";
import { AppWidgetContent, type WidgetData } from "./AppWidgetContent";

export function WidgetTile({
  id,
  app,
  size,
  data,
  editing,
  onRemove,
}: {
  id: string;
  app: WidgetApp;
  size: WidgetSize;
  data: WidgetData;
  editing: boolean;
  onRemove: (id: string) => void;
}) {
  const meta = appCatalog[app];
  const Icon = meta.icon;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${sizeSpec[size].className} relative ${isDragging ? "z-20 opacity-90" : ""}`}
    >
      <div
        className={`group/tile relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper p-4 transition-transform duration-150 ${
          editing ? "animate-jiggle cursor-grab active:cursor-grabbing" : "hover:-translate-y-1 hover:border-ink/20"
        }`}
        {...(editing ? { ...attributes, ...listeners } : {})}
      >
        {editing ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
            className="focus-ring absolute -left-1.5 -top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-danger text-white shadow-md"
            aria-label={`Remove ${meta.label} widget`}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        ) : null}

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold/25 to-sprout/30 text-ink">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <h3 className="truncate text-sm font-medium text-ink">{meta.label}</h3>
          </div>
          {editing ? <GripVertical className="h-4 w-4 shrink-0 text-ink/25" /> : null}
        </div>

        <div className="mt-3 min-w-0 flex-1 overflow-hidden">
          <AppWidgetContent app={app} size={size} data={data} />
        </div>

        {!editing ? (
          <Link href={meta.href} className="focus-ring absolute inset-0" aria-label={`Open ${meta.label}`} />
        ) : null}
      </div>
    </div>
  );
}
