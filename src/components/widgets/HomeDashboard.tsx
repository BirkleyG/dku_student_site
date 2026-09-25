"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Check } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { WidgetTile } from "./WidgetTile";
import { WidgetTileCard } from "./WidgetTileCard";
import { WidgetGallery } from "./WidgetGallery";
import { WidgetConfigEditor } from "./WidgetConfigEditor";
import type { WidgetData } from "./AppWidgetContent";
import type { WidgetInstance, WidgetKind } from "@/lib/widgets";
import { useT } from "@/lib/i18n/client";
import { dashboardEditTourBridge } from "@/lib/tourBridge";

export function HomeDashboard({
  initialLayout,
  data,
  canSave,
}: {
  initialLayout: WidgetInstance[];
  data: WidgetData;
  canSave: boolean;
}) {
  const t = useT("widgets");
  const router = useRouter();
  const [layout, setLayout] = useState<WidgetInstance[]>(initialLayout);
  const [localEditing, setLocalEditing] = useState(false);
  const tourWantsEditing = dashboardEditTourBridge.useValue();
  const editing = localEditing || tourWantsEditing;
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const save = async (next: WidgetInstance[]) => {
    if (!canSave) return;
    setSaving(true);
    await fetch("/api/dashboard/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        widgets: next.map((w) => ({ id: w.id, kind: w.kind, config: w.config })),
      }),
    });
    setSaving(false);
    router.refresh();
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLayout((prev) => {
      const oldIndex = prev.findIndex((w) => w.id === active.id);
      const newIndex = prev.findIndex((w) => w.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      save(next);
      return next;
    });
  };

  const removeWidget = (id: string) => {
    setLayout((prev) => {
      const next = prev.filter((w) => w.id !== id);
      save(next);
      return next;
    });
  };

  const addWidget = (kind: WidgetKind, config: Record<string, unknown> = {}) => {
    setLayout((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), kind, config }];
      save(next);
      return next;
    });
  };

  const configureWidget = (id: string, config: Record<string, unknown>) => {
    setLayout((prev) => {
      // Fresh id so the server treats this as a new instance — resets any
      // "since you added this" tracking (e.g. unread comments) instead of
      // silently rewriting history under the old one.
      const next = prev.map((w) => (w.id === id ? { id: crypto.randomUUID(), kind: w.kind, config } : w));
      save(next);
      return next;
    });
  };

  const doneEditing = () => {
    setLocalEditing(false);
    dashboardEditTourBridge.set(false);
  };
  const activeInstance = activeId ? (layout.find((w) => w.id === activeId) ?? null) : null;
  const configuringInstance = configuringId ? (layout.find((w) => w.id === configuringId) ?? null) : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          data-tour="widget-edit-toggle"
          onClick={() => (editing ? doneEditing() : setLocalEditing(true))}
          className="focus-ring flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink"
        >
          {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          {editing ? t("done") : t("editWidgets")}
        </button>
        {saving ? <span className="text-xs text-ink/35">{t("saving")}</span> : null}
      </div>

      {editing && !canSave ? (
        <p className="mt-2 text-xs text-ink/40">{t("loginToSave")}</p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={layout.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="mt-5 grid auto-rows-[8.5rem] grid-cols-2 gap-4 sm:auto-rows-[9.5rem] sm:grid-cols-4 lg:grid-cols-6">
            {layout.map((w, i) => (
              <WidgetTile
                key={w.id}
                instance={w}
                data={data}
                editing={editing}
                index={i}
                onRemove={removeWidget}
                onConfigure={setConfiguringId}
                tourTarget={i === 0}
              />
            ))}

            {editing ? (
              <button
                data-tour="widget-add-tile"
                onClick={() => setGalleryOpen(true)}
                className="focus-ring col-span-1 row-span-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-ink/20 text-ink/40 transition-colors hover:border-gold hover:text-gold"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">{t("addWidget")}</span>
              </button>
            ) : null}
          </div>
        </SortableContext>

        {/* Rendered as a floating clone at the dragged tile's own natural size,
            decoupled from the grid — so it never stretches/shrinks to match
            whatever slot it's currently hovering over. */}
        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
          {activeInstance ? (
            <WidgetTileCard instance={activeInstance} data={data} className="shadow-xl ring-2 ring-gold/40" />
          ) : null}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {galleryOpen ? (
          <WidgetGallery data={data} onAdd={addWidget} onClose={() => setGalleryOpen(false)} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {configuringInstance ? (
          <WidgetConfigEditor
            instance={configuringInstance}
            data={data}
            onSave={(config) => {
              configureWidget(configuringInstance.id, config);
              setConfiguringId(null);
            }}
            onClose={() => setConfiguringId(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
