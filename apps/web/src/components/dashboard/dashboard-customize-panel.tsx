"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { sectionLabel } from "@/lib/dashboard-section-labels";
import type { DashboardLayout, DashboardSectionId } from "@/types/user-preferences";

type Props = {
  layout: DashboardLayout;
  onChange: (next: DashboardLayout) => void;
  onSave: () => void;
};

function SortableRow({
  id,
  hidden,
  onToggleHidden
}: {
  id: DashboardSectionId;
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-border bg-card flex items-center gap-2 rounded-md border px-2 py-2"
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none p-1"
        aria-label={`Reorder ${sectionLabel(id)}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <span className="min-w-0 flex-1 text-sm font-medium">{sectionLabel(id)}</span>
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!hidden}
          onChange={onToggleHidden}
          className="border-input size-4 rounded"
        />
        Visible
      </label>
    </div>
  );
}

export function DashboardCustomizePanel({ layout, onChange, onSave }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = layout.order.indexOf(active.id as DashboardSectionId);
    const newIndex = layout.order.indexOf(over.id as DashboardSectionId);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    onChange({
      ...layout,
      order: arrayMove(layout.order, oldIndex, newIndex)
    });
  };

  const toggleHidden = (id: DashboardSectionId) => {
    const isHidden = layout.hidden.includes(id);
    onChange({
      ...layout,
      hidden: isHidden
        ? layout.hidden.filter((x) => x !== id)
        : [...layout.hidden, id]
    });
  };

  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Customize dashboard</CardTitle>
        <CardDescription>
          Drag to reorder sections. Uncheck to hide a section. Changes save to your
          account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={layout.order}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {layout.order.map((id) => (
                <SortableRow
                  key={id}
                  id={id}
                  hidden={layout.hidden.includes(id)}
                  onToggleHidden={() => toggleHidden(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button type="button" size="sm" onClick={onSave}>
          Save layout now
        </Button>
      </CardContent>
    </Card>
  );
}
