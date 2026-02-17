import { useState, useEffect, useRef } from 'react';
import { Check, X, RotateCcw, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModuleManagerProps {
  isEditMode: boolean;
  onEnterEdit: () => void;
  onValidate: () => void;
  onCancel: () => void;
  onReset: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export function ModuleManager({
  isEditMode,
  onEnterEdit,
  onValidate,
  onCancel,
  onReset,
}: ModuleManagerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 100;
      
      if (scrollY > threshold) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isEditMode) {
    return (
      <button
        onClick={onEnterEdit}
        aria-label="Customize dashboard layout"
        className={cn(
          "absolute top-8 right-6 z-40 group transition-all duration-500 ease-out",
          isVisible 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <div className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent border border-primary/40 backdrop-blur-md shadow-[0_0_12px_rgba(91,180,255,0.15),inset_0_1px_0_rgba(91,180,255,0.1)] hover:border-primary/70 hover:shadow-[0_0_20px_rgba(91,180,255,0.3),inset_0_1px_0_rgba(91,180,255,0.2)] active:scale-[0.98] transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <LayoutGrid className="w-4 h-4 text-primary relative z-10 transition-colors duration-300 group-hover:text-primary-glow" />
          <span className="text-xs font-rajdhani text-primary uppercase tracking-wider relative z-10 transition-colors duration-300 group-hover:text-primary-glow">
            Customize
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50" role="toolbar" aria-label="Dashboard layout editor">
      <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl" aria-hidden="true" />
      <div className="relative flex items-center gap-3 px-6 py-4 bg-card/95 backdrop-blur-xl border-2 border-primary/40 rounded-2xl shadow-[0_0_40px_rgba(91,180,255,0.4)]">
        {/* Edit mode indicator */}
        <div className="flex items-center gap-2 pr-4 border-r border-primary/30">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(91,180,255,0.8)]" aria-hidden="true" />
          <span className="text-sm font-orbitron text-primary uppercase tracking-wider">
            Edit Mode
          </span>
        </div>

        {/* Reset button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          aria-label="Reset layout to defaults"
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 font-orbitron text-xs uppercase tracking-wider"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>

        {/* Cancel button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          aria-label="Cancel editing"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 font-orbitron text-xs uppercase tracking-wider"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        {/* Validate button */}
        <Button
          size="sm"
          onClick={onValidate}
          aria-label="Save layout changes"
          className="bg-gradient-to-r from-health to-health/80 hover:from-health/90 hover:to-health/70 text-health-foreground font-orbitron text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.6)] transition-all"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Layout
        </Button>
      </div>
    </div>
  );
}