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
      setIsVisible(scrollY <= 100);
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
        <div
          className="relative flex items-center gap-2 px-4 py-2 bg-[rgba(2,4,10,0.97)] backdrop-blur-[20px] border border-[rgba(0,180,255,0.25)] hover:border-[rgba(0,210,255,0.5)] shadow-[0_0_12px_rgba(0,180,255,0.1)] hover:shadow-[0_0_20px_rgba(0,180,255,0.2)] active:scale-[0.98] transition-all duration-300 overflow-hidden"
          style={{ borderRadius: "4px" }}
        >
          <LayoutGrid className="w-4 h-4 text-primary relative z-10" />
          <span className="text-xs font-rajdhani text-primary uppercase tracking-[0.15em] relative z-10">
            Customize
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50" role="toolbar" aria-label="Dashboard layout editor">
      <div
        className="relative flex items-center gap-3 px-6 py-4 bg-[rgba(2,4,10,0.97)] backdrop-blur-[20px] border border-[rgba(0,210,255,0.4)] shadow-[0_0_40px_rgba(0,180,255,0.2)]"
        style={{ borderRadius: "4px" }}
      >
        <div className="flex items-center gap-2 pr-4 border-r border-[rgba(0,180,255,0.2)]">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,180,255,0.8)]" />
          <span className="text-sm font-orbitron text-primary uppercase tracking-[0.15em]">Edit Mode</span>
        </div>

        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground hover:text-primary hover:bg-[rgba(0,180,255,0.05)] font-orbitron text-xs uppercase tracking-[0.15em]">
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive hover:text-destructive hover:bg-destructive/10 font-orbitron text-xs uppercase tracking-[0.15em]">
          <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
        <Button size="sm" onClick={onValidate} className="bg-gradient-to-r from-health to-health/80 hover:from-health/90 hover:to-health/70 text-health-foreground font-orbitron text-xs uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(74,222,128,0.3)]" style={{ borderRadius: "4px" }}>
          <Check className="w-4 h-4 mr-2" /> Save Layout
        </Button>
      </div>
    </div>
  );
}
