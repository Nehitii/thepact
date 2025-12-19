import { ReactNode, useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragMoveEvent,
  MeasuringStrategy,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
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
        distance: 8, // Small threshold to prevent accidental drags
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    const module = modules.find(m => m.id === id);
    setActiveModule(module || null);
    
    // Add body class to prevent scroll during drag
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveModule(null);
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveModule(null);
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
  };

  const sortedModules = useMemo(() => 
    [...modules].sort((a, b) => a.order - b.order),
    [modules]
  );

  const getSizeWidth = (size: string) => {
    switch (size) {
      case 'full': return '100%';
      case 'half': return 'calc(50% - 0.75rem)';
      case 'quarter': return 'calc(25% - 1.125rem)';
      default: return '100%';
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
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
        strategy={horizontalListSortingStrategy}
      >
        <div className={cn(
          "flex flex-wrap gap-6 transition-all duration-200",
          isEditMode && "pb-32"
        )}>
          {children}
        </div>
      </SortableContext>
      
      {/* Drag overlay for visual feedback - follows cursor exactly */}
      <DragOverlay 
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        style={{ cursor: 'grabbing' }}
      >
        {activeId && activeModule && (
          <div 
            className={cn(
              "bg-card/95 backdrop-blur-xl rounded-lg border-2 border-primary p-4",
              "shadow-[0_0_30px_rgba(91,180,255,0.5),0_10px_40px_rgba(0,0,0,0.3)]",
              "pointer-events-none"
            )}
            style={{ 
              width: getSizeWidth(activeModule.size),
              maxWidth: '300px',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(91,180,255,0.8)]" />
              <div className="text-primary font-orbitron text-sm uppercase tracking-wider truncate">
                {activeModule.name}
              </div>
            </div>
            <div className="mt-3 h-12 bg-gradient-to-br from-primary/10 to-transparent rounded-md border border-primary/20" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
