"use client";

import Link from "next/link";
import { X, GripVertical, Settings2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { widgetCatalog, sizeSpec, hrefForInstance, type WidgetInstance } from "@/lib/widgets";
import { WidgetTileCard } from "./WidgetTileCard";
import type { WidgetData } from "./AppWidgetContent";

export function WidgetTile({
  instance,
  data,
  editing,
  index,
  onRemove,
  onConfigure,
}: {
  instance: WidgetInstance;
  data: WidgetData;
  editing: boolean;
  index: number;
  onRemove: (id: string) => void;
  onConfigure: (id: string) => void;
}) {
  const meta = widgetCatalog[instance.kind];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: instance.id,
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
      className={`${sizeSpec[meta.size].className} relative ${isDragging ? "z-20 opacity-30" : ""}`}
    >
      {editing ? (
        <div className="pointer-events-none absolute inset-0 z-30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(instance.id);
            }}
            className="focus-ring pointer-events-auto absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-danger text-white shadow-md ring-2 ring-paper"
            aria-label={`Remove ${meta.label} widget`}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          {meta.configurable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure(instance.id);
              }}
              className="focus-ring pointer-events-auto absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-white shadow-md ring-2 ring-paper"
              aria-label={`Configure ${meta.label} widget`}
            >
              <Settings2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={`relative h-full transition-transform duration-150 ${
          editing ? "cursor-grab active:cursor-grabbing" : "hover:-translate-y-1"
        }`}
        {...(editing ? { ...attributes, ...listeners } : {})}
      >
        <WidgetTileCard instance={instance} data={data} jiggle={editing} jiggleIndex={index} className="hover:border-ink/20" />

        {editing ? (
          <GripVertical className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-ink/25" />
        ) : (
          <Link href={hrefForInstance(instance)} className="focus-ring absolute inset-0 rounded-lg" aria-label={`Open ${meta.label}`} />
        )}
      </div>
    </div>
  );
}
