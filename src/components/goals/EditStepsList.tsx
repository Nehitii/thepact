import React, { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Plus } from "lucide-react";

export interface EditStepItem {
  /** DB id if existing step, undefined if newly added */
  dbId?: string;
  name: string;
  /** Unique key for sortable */
  key: string;
}

interface EditStepsListProps {
  items: EditStepItem[];
  onItemsChange: (items: EditStepItem[]) => void;
}

interface SortableStepProps {
  id: string;
  index: number;
  name: string;
  onNameChange: (value: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function SortableStep({ id, index, name, onNameChange, onDelete, canDelete }: SortableStepProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 group ${isDragging ? "shadow-lg rounded-xl" : ""}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">{index + 1}.</span>
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={`Step ${index + 1}`}
        maxLength={100}
        autoComplete="off"
        className="h-10 text-sm rounded-xl flex-1 bg-background/50 border-white/10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:border-primary/50"
      />
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Delete step"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function EditStepsList({ items, onItemsChange }: EditStepsListProps) {
  const sortableIds = items.map((item) => item.key);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortableIds.indexOf(active.id as string);
      const newIndex = sortableIds.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      onItemsChange(arrayMove([...items], oldIndex, newIndex));
    },
    [sortableIds, items, onItemsChange],
  );

  const handleNameChange = useCallback(
    (index: number, value: string) => {
      const updated = [...items];
      updated[index] = { ...updated[index], name: value };
      onItemsChange(updated);
    },
    [items, onItemsChange],
  );

  const handleDelete = useCallback(
    (index: number) => {
      onItemsChange(items.filter((_, i) => i !== index));
    },
    [items, onItemsChange],
  );

  const handleAdd = useCallback(() => {
    if (items.length >= 20) return;
    onItemsChange([
      ...items,
      {
        name: `Step ${items.length + 1}`,
        key: `new-${Date.now()}-${Math.random()}`,
      },
    ]);
  }, [items, onItemsChange]);

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableStep
              key={item.key}
              id={item.key}
              index={index}
              name={item.name}
              onNameChange={(val) => handleNameChange(index, val)}
              onDelete={() => handleDelete(index)}
              canDelete={items.length > 1}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={items.length >= 20}
        className="w-full mt-2 rounded-xl border-dashed border-primary/30 text-primary/70 hover:text-primary hover:border-primary/50 hover:bg-primary/5"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Step
      </Button>
    </div>
  );
}
