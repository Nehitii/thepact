import { ReactNode, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
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
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    const module = modules.find(m => m.id === id);
    setActiveModule(module || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveModule(null);
    
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveModule(null);
  };

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <SortableContext
        items={sortedModules.map(m => m.id)}
        strategy={rectSortingStrategy}
      >
        <div className={cn(
          "flex flex-wrap gap-6 transition-all duration-300",
          isEditMode && "pb-32"
        )}>
          {children}
        </div>
      </SortableContext>
      
      {/* Drag overlay for visual feedback */}
      <DragOverlay dropAnimation={{
        duration: 300,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      }}>
        {activeId && activeModule && (
          <div 
            className={cn(
              "bg-card/90 backdrop-blur-xl rounded-lg border-2 border-primary p-4",
              "shadow-[0_0_40px_rgba(91,180,255,0.5),0_20px_60px_rgba(0,0,0,0.4)]",
              "transform rotate-1",
              activeModule.size === 'half' ? 'w-[calc(50%-0.75rem)]' : 'w-full'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(91,180,255,0.8)]" />
              <div className="text-primary font-orbitron text-sm uppercase tracking-wider">
                {activeModule.name}
              </div>
            </div>
            <div className="mt-2 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-md border border-primary/20" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
