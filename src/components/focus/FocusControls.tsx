import { Play, Pause, SkipForward, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PomodoroPhase } from "@/hooks/usePomodoro";

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
  const isIdle = phase === "idle";

  if (isIdle) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-card/60 backdrop-blur border border-border/50">
      {isPaused ? (
        <Button onClick={onResume} size="lg" className="gap-2 font-orbitron text-sm px-8">
          <Play className="h-4 w-4" />
          Resume
        </Button>
      ) : (
        <Button onClick={onPause} variant="outline" size="lg" className="gap-2 font-orbitron text-sm px-6">
          <Pause className="h-4 w-4" />
          Pause
        </Button>
      )}

      <Button onClick={onSkip} variant="outline" size="icon" className="h-11 w-11" title="Skip phase">
        <SkipForward className="h-4 w-4" />
      </Button>

      <Button onClick={onEnd} variant="destructive" size="lg" className="gap-2 font-orbitron text-sm px-6">
        <Square className="h-4 w-4" />
        End
      </Button>
    </div>
  );
}
