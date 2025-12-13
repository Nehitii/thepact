import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleCardProps {
  id: string;
  children: ReactNode;
  isEditMode?: boolean;
  isEnabled?: boolean;
  onToggle?: () => void;
  className?: string;
  size?: 'full' | 'half';
}

export function ModuleCard({ 
  id, 
  children, 
  isEditMode = false, 
  isEnabled = true,
  onToggle,
  className,
  size = 'full'
}: ModuleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!isEditMode && !isEnabled) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative transition-all duration-300',
        size === 'half' ? 'w-full md:w-[calc(50%-0.75rem)]' : 'w-full',
        isDragging && 'z-50 scale-[1.02]',
        isEditMode && 'cursor-grab active:cursor-grabbing',
        isEditMode && !isEnabled && 'opacity-50',
        className
      )}
    >
      {/* Edit mode overlay */}
      {isEditMode && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Glow effect when dragging */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-xl animate-pulse" />
          )}
          
          {/* Controls overlay */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 pointer-events-auto">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/90 backdrop-blur-xl border border-primary/40 shadow-[0_0_15px_rgba(91,180,255,0.3)] cursor-grab active:cursor-grabbing hover:border-primary/60 transition-all"
            >
              <GripVertical className="w-4 h-4 text-primary" />
              <span className="text-xs font-orbitron text-primary uppercase tracking-wider">Drag</span>
            </div>
            
            {/* Toggle visibility button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md backdrop-blur-xl border transition-all",
                isEnabled 
                  ? "bg-health/20 border-health/40 hover:border-health/60 text-health shadow-[0_0_15px_rgba(74,222,128,0.3)]"
                  : "bg-destructive/20 border-destructive/40 hover:border-destructive/60 text-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              )}
            >
              {isEnabled ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span className="text-xs font-orbitron uppercase tracking-wider">
                {isEnabled ? 'Visible' : 'Hidden'}
              </span>
            </button>
          </div>
          
          {/* Edit mode border */}
          <div className={cn(
            "absolute inset-0 rounded-lg border-2 border-dashed transition-colors",
            isDragging ? "border-primary" : "border-primary/30",
            !isEnabled && "border-destructive/30"
          )} />
        </div>
      )}
      
      {/* Module content */}
      <div className={cn(
        isEditMode && 'pt-12'
      )}>
        {children}
      </div>
    </div>
  );
}
