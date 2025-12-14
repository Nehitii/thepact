import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModuleConfig } from '@/hooks/useModuleLayout';

interface ModuleCardProps {
  id: string;
  name?: string;
  children: ReactNode;
  isEditMode?: boolean;
  isEnabled?: boolean;
  onToggle?: () => void;
  className?: string;
  size?: 'full' | 'half';
}

export function ModuleCard({ 
  id, 
  name,
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
    isOver,
  } = useSortable({ 
    id, 
    disabled: !isEditMode,
    transition: {
      duration: 300,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging 
      ? 'none' 
      : `${transition}, opacity 300ms ease, box-shadow 300ms ease`,
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
        isDragging && 'z-50 scale-[1.02] opacity-90',
        isEditMode && !isDragging && 'cursor-grab',
        isDragging && 'cursor-grabbing',
        isEditMode && !isEnabled && 'opacity-40',
        isOver && !isDragging && 'scale-[0.98]',
        className
      )}
    >
      {/* Drag glow effect */}
      {isDragging && (
        <div className="absolute -inset-2 bg-primary/30 rounded-xl blur-2xl animate-pulse pointer-events-none" />
      )}
      
      {/* Drop indicator glow */}
      {isOver && !isDragging && (
        <div className="absolute -inset-1 bg-accent/20 rounded-lg blur-lg pointer-events-none animate-pulse" />
      )}
      
      {/* Edit mode overlay */}
      {isEditMode && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Controls overlay */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 pointer-events-auto">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/90 backdrop-blur-xl border shadow-[0_0_15px_rgba(91,180,255,0.3)] cursor-grab active:cursor-grabbing transition-all",
                isDragging 
                  ? "border-primary shadow-[0_0_25px_rgba(91,180,255,0.6)] scale-105" 
                  : "border-primary/40 hover:border-primary/60"
              )}
            >
              <GripVertical className={cn("w-4 h-4 transition-colors", isDragging ? "text-accent" : "text-primary")} />
              <span className="text-xs font-orbitron text-primary uppercase tracking-wider max-w-[100px] truncate">
                {name || 'Drag'}
              </span>
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
            "absolute inset-0 rounded-lg border-2 border-dashed transition-all duration-300",
            isDragging 
              ? "border-primary shadow-[0_0_30px_rgba(91,180,255,0.4)]" 
              : "border-primary/30",
            !isEnabled && "border-destructive/30",
            isOver && !isDragging && "border-accent/50 bg-accent/5"
          )} />
        </div>
      )}
      
      {/* Module content */}
      <div className={cn(
        isEditMode && 'pt-12',
        isDragging && 'opacity-80'
      )}>
        {children}
      </div>
    </div>
  );
}
