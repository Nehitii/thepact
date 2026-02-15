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
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, Trash2, Plus, Dices } from "lucide-react";

export interface EditStepItem {
  /** DB id if existing step, undefined if newly added */
  dbId?: string;
  name: string;
  /** Unique key for sortable */
  key: string;
  /** If true, this step is excluded from the mission spin/randomizer */
  excludeFromSpin?: boolean;
}

interface EditStepsListProps {
  items: EditStepItem[];
  onItemsChange: (items: EditStepItem[]) => void;
}

interface SortableStepProps {
  id: string;
  index: number;
  name: string;
  excludeFromSpin?: boolean;
  onNameChange: (value: string) => void;
  onExcludeChange: (checked: boolean) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function SortableStep({ id, index, name, excludeFromSpin, onNameChange, onExcludeChange, onDelete, canDelete }: SortableStepProps) {
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
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onExcludeChange(!excludeFromSpin)}
            className={`p-1.5 rounded-lg transition-all duration-200 shrink-0 ${
              excludeFromSpin
                ? "text-amber-400 bg-amber-500/15"
                : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30"
            }`}
            title={excludeFromSpin ? "Excluded from spin" : "Included in spin"}
          >
            <Dices className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {excludeFromSpin ? "Excluded from Mission Roulette" : "Click to exclude from Mission Roulette"}
        </TooltipContent>
      </Tooltip>
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

  const handleExcludeChange = useCallback(
    (index: number, checked: boolean) => {
      const updated = [...items];
      updated[index] = { ...updated[index], excludeFromSpin: checked };
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
              excludeFromSpin={item.excludeFromSpin}
              onNameChange={(val) => handleNameChange(index, val)}
              onExcludeChange={(checked) => handleExcludeChange(index, checked)}
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
