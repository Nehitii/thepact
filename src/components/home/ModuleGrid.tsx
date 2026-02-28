import { ReactNode, useState, useMemo, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
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
  const [activeModule, setActiveModule] = useState<ModuleConfig | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    setActiveModule(modules.find(m => m.id === id) || null);
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';
    document.body.classList.add('dragging');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveModule(null);
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('dragging');
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveModule(null);
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('dragging');
  };

  const sortedModules = useMemo(() => 
    [...modules].sort((a, b) => a.order - b.order),
    [modules]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{
        droppable: { strategy: MeasuringStrategy.Always },
      }}
    >
      <SortableContext
        items={sortedModules.map(m => m.id)}
        strategy={rectSortingStrategy}
      >
        <div 
          ref={containerRef}
          className={cn(
            "grid grid-cols-12 gap-4 transition-all duration-200",
            isEditMode && "pb-32"
          )}
        >
          {children}
        </div>
      </SortableContext>
      
      <DragOverlay 
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {activeId && activeModule && (
          <div className={cn(
            "bg-[rgba(6,11,22,0.95)] backdrop-blur-xl rounded-sm border border-primary/40 p-4",
            "shadow-[0_0_40px_rgba(0,180,255,0.3)]",
            "pointer-events-none",
          )}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="text-primary font-orbitron text-[10px] uppercase tracking-[0.2em]">
                {activeModule.name}
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
