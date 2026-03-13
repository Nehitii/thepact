import { Play, Pause, SkipForward, Square } from "lucide-react";
import type { PomodoroPhase } from "@/hooks/usePomodoro";
import { cn } from "@/lib/utils";

interface FocusControlsProps {
  phase: PomodoroPhase;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onEnd: () => void;
}

export function FocusControls({ phase, isPaused, onStart, onPause, onResume, onSkip, onEnd }: FocusControlsProps) {
  if (phase === "idle") return null;

  return (
    <div
      className="flex flex-col gap-2 p-3 bg-[#0a0a0c]/80 border border-primary/30 backdrop-blur-md relative"
      style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/60" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/60" />

      <div className="text-[8px] font-mono text-primary/50 uppercase tracking-[0.2em] mb-1">
        Manual Override controls
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        {/* Main Action (Pause/Resume) */}
        <button
          onClick={isPaused ? onResume : onPause}
          className={cn(
            "flex items-center justify-between px-4 h-12 border transition-all duration-200 group relative overflow-hidden",
            isPaused
              ? "bg-primary/20 border-primary text-primary hover:bg-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
              : "bg-muted/10 border-primary/40 text-primary hover:border-primary hover:bg-primary/10",
          )}
          style={{
            clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
          }}
        >
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase relative z-10">
            {isPaused ? "[ > EXE.RESUME ]" : "[ || SYS.HALT ]"}
            <span className="text-[8px] text-primary/40 ml-1.5">(SPACE)</span>
          </span>
          {isPaused ? <Play className="h-4 w-4 relative z-10 ml-1" /> : <Pause className="h-4 w-4 relative z-10" />}
        </button>

        {/* Skip Action */}
        <button
          onClick={onSkip}
          className="w-12 h-12 bg-muted/10 border border-border flex flex-col items-center justify-center hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground group"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
          title="Skip Phase (⇧+S)"
        >
          <SkipForward className="h-4 w-4 group-hover:text-foreground" />
          <span className="text-[8px] font-mono text-muted-foreground/50 leading-none mt-0.5">⇧+S</span>
        </button>
      </div>

      {/* End Action */}
      <button
        onClick={onEnd}
        className="flex items-center justify-center gap-2 w-full h-10 bg-destructive/10 border border-destructive/40 text-destructive hover:bg-destructive/20 hover:border-destructive transition-all mt-1 group"
        style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
      >
        <Square className="h-3 w-3 group-hover:text-destructive" />
        <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase group-hover:text-destructive">
          Abort Operation
        </span>
        <span className="text-[8px] font-mono text-destructive/40">(ESC)</span>
      </button>
    </div>
  );
}
