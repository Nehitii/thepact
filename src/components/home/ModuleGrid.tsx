import { ReactNode, useState, useMemo, useRef, useEffect } from 'react';
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
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  UniqueIdentifier,
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
  
  // Custom pointer sensor with better activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced threshold for more responsive drag
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
    document.body.classList.add('dragging');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveModule(null);
    
    // Restore body scroll
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
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('dragging');
  };

  const sortedModules = useMemo(() => 
    [...modules].sort((a, b) => a.order - b.order),
    [modules]
  );

  // FIX #3: Get proper size width for the overlay matching actual module width
  const getSizeClass = (size: string): string => {
    switch (size) {
      case 'full': return 'w-full';
      case 'half': return 'w-[calc(50%-0.75rem)]';
      case 'quarter': return 'w-[calc(25%-1.125rem)]';
      default: return 'w-full';
    }
  };

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
        <div 
          ref={containerRef}
          className={cn(
            "flex flex-wrap gap-6 transition-all duration-200",
            isEditMode && "pb-32"
          )}
        >
          {children}
        </div>
      </SortableContext>
      
      {/* FIX #3: Improved drag overlay - matches actual module size and follows cursor */}
      <DragOverlay 
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        modifiers={[]}
        style={{ 
          cursor: 'grabbing',
        }}
      >
        {activeId && activeModule && (
          <div 
            className={cn(
              "bg-card/95 backdrop-blur-xl rounded-lg border-2 border-primary p-4",
              "shadow-[0_0_40px_rgba(91,180,255,0.6),0_20px_60px_rgba(0,0,0,0.4)]",
              "pointer-events-none",
              getSizeClass(activeModule.size)
            )}
            style={{ 
              // Use min/max to prevent overlay from being too small or too large
              minWidth: activeModule.size === 'quarter' ? '180px' : activeModule.size === 'half' ? '280px' : '400px',
              maxWidth: activeModule.size === 'full' ? '100%' : activeModule.size === 'half' ? '400px' : '250px',
            }}
          >
            {/* Module preview header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(91,180,255,0.8)]" />
              <div className="text-primary font-orbitron text-sm uppercase tracking-wider truncate font-bold">
                {activeModule.name}
              </div>
            </div>
            
            {/* Skeleton preview */}
            <div className="space-y-2">
              <div className="h-3 bg-gradient-to-r from-primary/20 to-transparent rounded-full w-3/4" />
              <div className="h-3 bg-gradient-to-r from-primary/15 to-transparent rounded-full w-1/2" />
              <div className="h-8 bg-gradient-to-br from-primary/10 to-transparent rounded-md border border-primary/20 mt-3" />
            </div>
            
            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2 border-primary rounded-tl" />
            <div className="absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2 border-primary rounded-tr" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-l-2 border-b-2 border-primary rounded-bl" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 border-primary rounded-br" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
