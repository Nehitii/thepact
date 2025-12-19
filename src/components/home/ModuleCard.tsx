import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Maximize2, Columns2, Grid2X2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModuleSize, ModuleCategory } from '@/hooks/useModuleLayout';

interface ModuleCardProps {
  id: string;
  name?: string;
  children: ReactNode;
  isEditMode?: boolean;
  isEnabled?: boolean;
  onToggle?: () => void;
  onCycleSize?: () => void;
  className?: string;
  size?: ModuleSize;
  category?: ModuleCategory;
  allowedSizes?: ModuleSize[];
  isPlaceholder?: boolean;
  isOver?: boolean;
}

const sizeIcons = {
  full: Maximize2,
  half: Columns2,
  quarter: Grid2X2,
};

const sizeLabels = {
  full: 'Full',
  half: 'Half',
  quarter: 'Quarter',
};

export function ModuleCard({ 
  id, 
  name,
  children, 
  isEditMode = false, 
  isEnabled = true,
  onToggle,
  onCycleSize,
  className,
  size = 'full',
  category = 'display',
  allowedSizes = ['full', 'half'],
  isPlaceholder = false,
  isOver: externalIsOver,
}: ModuleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver: sortableIsOver,
  } = useSortable({ 
    id, 
    disabled: !isEditMode,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const isOver = externalIsOver ?? sortableIsOver;

  // Calculate width based on size
  const getWidthClass = () => {
    switch (size) {
      case 'full':
        return 'w-full';
      case 'half':
        return 'w-full md:w-[calc(50%-0.75rem)]';
      case 'quarter':
        return 'w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(25%-1.125rem)]';
      default:
        return 'w-full';
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform ? {
      ...transform,
      scaleX: 1,
      scaleY: 1,
    } : null),
    transition: isDragging 
      ? 'none' 
      : transition,
    zIndex: isDragging ? 100 : 1,
  };

  if (!isEditMode && !isEnabled) {
    return null;
  }

  const SizeIcon = sizeIcons[size];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      className={cn(
        'relative transition-all duration-200',
        getWidthClass(),
        isEditMode && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
        isEditMode && !isEnabled && 'opacity-40',
        isOver && !isDragging && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background rounded-lg',
        className
      )}
    >
      {/* Drop indicator glow */}
      {isOver && !isDragging && (
        <div className="absolute -inset-1 bg-primary/20 rounded-lg blur-lg pointer-events-none animate-pulse" />
      )}
      
      {/* Edit mode overlay */}
      {isEditMode && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Controls overlay - top right */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-auto">
            {/* Size toggle button */}
            {allowedSizes.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onCycleSize?.();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-xl border transition-all",
                  "bg-card/90 border-accent/40 hover:border-accent/60 text-accent shadow-[0_0_12px_rgba(122,191,255,0.3)]"
                )}
              >
                <SizeIcon className="w-3 h-3" />
                <span className="text-[10px] font-orbitron uppercase tracking-wider">
                  {sizeLabels[size]}
                </span>
              </button>
            )}
            
            {/* Toggle visibility button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggle?.();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-xl border transition-all",
                isEnabled 
                  ? "bg-health/20 border-health/40 hover:border-health/60 text-health shadow-[0_0_12px_rgba(74,222,128,0.3)]"
                  : "bg-destructive/20 border-destructive/40 hover:border-destructive/60 text-destructive shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              )}
            >
              {isEnabled ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
            </button>
          </div>
          
          {/* Module name label - top left */}
          <div className="absolute top-2 left-2 pointer-events-none">
            <div className="px-2 py-1 rounded-md bg-card/90 backdrop-blur-xl border border-primary/40 shadow-[0_0_12px_rgba(91,180,255,0.2)]">
              <span className="text-[10px] font-orbitron text-primary uppercase tracking-wider">
                {name || 'Module'}
              </span>
            </div>
          </div>
          
          {/* Edit mode border */}
          <div className={cn(
            "absolute inset-0 rounded-lg border-2 border-dashed transition-all duration-200",
            isDragging 
              ? "border-primary shadow-[0_0_20px_rgba(91,180,255,0.4)]" 
              : "border-primary/30",
            !isEnabled && "border-destructive/30",
            isOver && !isDragging && "border-primary/60 bg-primary/5"
          )} />
        </div>
      )}
      
      {/* Module content */}
      <div className={cn(
        isEditMode && 'pt-10',
        isDragging && 'opacity-80'
      )}>
        {children}
      </div>
    </div>
  );
}
