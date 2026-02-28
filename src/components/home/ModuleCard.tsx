import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Maximize2, Columns2, Grid2X2, EyeOff as HiddenIcon } from 'lucide-react';
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

  // CSS Grid column spans
  const getGridSpan = () => {
    switch (size) {
      case 'full': return 'col-span-12';
      case 'half': return 'col-span-12 md:col-span-6';
      case 'quarter': return 'col-span-12 sm:col-span-6 md:col-span-4';
      default: return 'col-span-12';
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform ? {
      ...transform,
      scaleX: 1,
      scaleY: 1,
    } : null),
    transition: isDragging ? 'none' : transition,
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
        getGridSpan(),
        isEditMode && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
        isOver && !isDragging && 'ring-1 ring-primary/30 rounded-sm',
        className
      )}
    >
      {/* Edit mode overlay */}
      {isEditMode && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-auto">
            {allowedSizes.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCycleSize?.(); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-2 py-1 rounded-sm backdrop-blur-xl border bg-[rgba(6,11,22,0.9)] border-primary/30 hover:border-primary/50 text-primary"
              >
                <SizeIcon className="w-3 h-3" />
                <span className="text-[10px] font-orbitron uppercase tracking-wider">{sizeLabels[size]}</span>
              </button>
            )}
            
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle?.(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-sm backdrop-blur-xl border",
                isEnabled 
                  ? "bg-[rgba(6,11,22,0.9)] border-emerald-500/30 text-emerald-400"
                  : "bg-[rgba(6,11,22,0.9)] border-red-500/30 text-red-400"
              )}
            >
              {isEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>
          
          <div className="absolute top-2 left-2 pointer-events-none">
            <div className="px-2 py-1 rounded-sm backdrop-blur-xl bg-[rgba(6,11,22,0.9)] border border-[rgba(0,180,255,0.15)]">
              <span className="text-[10px] font-orbitron uppercase tracking-wider text-[rgba(160,210,255,0.6)]">
                {name || 'Module'}
              </span>
            </div>
          </div>
          
          <div className={cn(
            "absolute inset-0 rounded-sm border border-dashed",
            isDragging ? "border-primary/50" : isEnabled ? "border-[rgba(0,180,255,0.15)]" : "border-red-500/20",
          )} />
        </div>
      )}
      
      {/* Hidden state overlay */}
      {isEditMode && !isEnabled && (
        <div className="absolute inset-0 z-10 rounded-sm overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-red-500/10 border border-red-500/20">
              <HiddenIcon className="w-3.5 h-3.5 text-red-400/60" />
              <span className="text-[10px] font-orbitron text-red-400/60 uppercase tracking-wider">Hidden</span>
            </div>
          </div>
        </div>
      )}
      
      <div className={cn(isEditMode && 'pt-10', isDragging && 'opacity-80')}>
        {children}
      </div>
    </div>
  );
}
