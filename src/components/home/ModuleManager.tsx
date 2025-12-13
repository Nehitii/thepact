import { Settings2, Check, X, RotateCcw, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModuleManagerProps {
  isEditMode: boolean;
  onEnterEdit: () => void;
  onValidate: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function ModuleManager({
  isEditMode,
  onEnterEdit,
  onValidate,
  onCancel,
  onReset,
}: ModuleManagerProps) {
  if (!isEditMode) {
    return (
      <button
        onClick={onEnterEdit}
        className="fixed bottom-24 right-4 z-40 group"
      >
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />
        <div className="relative flex items-center gap-2 px-4 py-3 bg-card/90 backdrop-blur-xl border-2 border-primary/40 rounded-full shadow-[0_0_20px_rgba(91,180,255,0.3)] hover:border-primary/60 hover:shadow-[0_0_30px_rgba(91,180,255,0.5)] transition-all">
          <LayoutGrid className="w-5 h-5 text-primary" />
          <span className="text-sm font-orbitron text-primary uppercase tracking-wider hidden sm:inline">
            Customize
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
      <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl" />
      <div className="relative flex items-center gap-3 px-6 py-4 bg-card/95 backdrop-blur-xl border-2 border-primary/40 rounded-2xl shadow-[0_0_40px_rgba(91,180,255,0.4)]">
        {/* Edit mode indicator */}
        <div className="flex items-center gap-2 pr-4 border-r border-primary/30">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(91,180,255,0.8)]" />
          <span className="text-sm font-orbitron text-primary uppercase tracking-wider">
            Edit Mode
          </span>
        </div>

        {/* Reset button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
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
          className="text-destructive hover:text-destructive hover:bg-destructive/10 font-orbitron text-xs uppercase tracking-wider"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        {/* Validate button */}
        <Button
          size="sm"
          onClick={onValidate}
          className="bg-gradient-to-r from-health to-health/80 hover:from-health/90 hover:to-health/70 text-health-foreground font-orbitron text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.6)] transition-all"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Layout
        </Button>
      </div>
    </div>
  );
}
