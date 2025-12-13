import { ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { ModuleConfig } from '@/hooks/useModuleLayout';
import { cn } from '@/lib/utils';

interface ModuleGridProps {
  modules: ModuleConfig[];
  isEditMode: boolean;
  onReorder: (activeId: string, overId: string) => void;
  children: ReactNode;
}

export function ModuleGrid({ 
  modules, 
  isEditMode, 
  onReorder, 
  children 
}: ModuleGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedModules.map(m => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn(
          "flex flex-wrap gap-6 transition-all duration-300",
          isEditMode && "pb-32"
        )}>
          {children}
        </div>
      </SortableContext>
      
      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeId && (
          <div className="opacity-80 bg-primary/10 rounded-lg border-2 border-primary p-4 shadow-[0_0_30px_rgba(91,180,255,0.5)]">
            <div className="text-primary font-orbitron text-sm uppercase tracking-wider">
              Moving module...
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
