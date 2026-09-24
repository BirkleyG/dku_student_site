"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Check } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { WidgetTile } from "./WidgetTile";
import { WidgetGallery } from "./WidgetGallery";
import type { WidgetData } from "./AppWidgetContent";
import type { WidgetApp, WidgetInstance, WidgetSize } from "@/lib/widgets";

export function HomeDashboard({
  initialLayout,
  data,
  canSave,
}: {
  initialLayout: WidgetInstance[];
  data: WidgetData;
  canSave: boolean;
}) {
  const router = useRouter();
  const [layout, setLayout] = useState<WidgetInstance[]>(initialLayout);
  const [editing, setEditing] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
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
        widgets: next.map((w) => ({ type: w.app, size: w.size })),
      }),
    });
    setSaving(false);
    router.refresh();
  };

  const handleDragEnd = (event: DragEndEvent) => {
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

  const addWidget = (app: WidgetApp, size: WidgetSize) => {
    setLayout((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), app, size }];
      save(next);
      return next;
    });
  };

  const doneEditing = () => setEditing(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => (editing ? doneEditing() : setEditing(true))}
          className="focus-ring flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink"
        >
          {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          {editing ? "Done" : "Edit widgets"}
        </button>
        {saving ? <span className="text-xs text-ink/35">Saving…</span> : null}
      </div>

      {editing && !canSave ? (
        <p className="mt-2 text-xs text-ink/40">Log in to save your dashboard layout.</p>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="mt-5 grid auto-rows-[8.5rem] grid-cols-2 gap-4 sm:auto-rows-[9.5rem] sm:grid-cols-4 lg:grid-cols-6">
            {layout.map((w) => (
              <WidgetTile
                key={w.id}
                id={w.id}
                app={w.app}
                size={w.size}
                data={data}
                editing={editing}
                onRemove={removeWidget}
              />
            ))}

            {editing ? (
              <button
                onClick={() => setGalleryOpen(true)}
                className="focus-ring col-span-1 row-span-1 flex flex-col items-center justify-center gap-1.5 rounded-3xl border-2 border-dashed border-ink/20 text-ink/40 transition-colors hover:border-gold hover:text-gold"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">Add widget</span>
              </button>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>

      <AnimatePresence>
        {galleryOpen ? (
          <WidgetGallery data={data} onAdd={addWidget} onClose={() => setGalleryOpen(false)} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
