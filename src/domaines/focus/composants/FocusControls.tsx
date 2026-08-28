import { Play, Pause, SkipForward, Square } from "lucide-react";
import { FocusDistractionButton } from "./FocusDistractionButton";
import { useTranslation } from "react-i18next";
import type { PomodoroPhase } from "@/domaines/focus/hooks/usePomodoro";
import { cn } from "@/lib/utils";

interface FocusControlsProps {
  phase: PomodoroPhase;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onEnd: () => void;
}

/* Les commandes d une session en cours. Elles etaient rendues sur mobile
   seulement — c est-a-dire la ou il n y a pas de clavier, alors que les
   raccourcis qu elles annoncent n existent que sur bureau. Elles sont
   desormais les memes partout, et toujours visibles : sur un ecran large
   elles tiennent sur une ligne, sous l anneau. */
export function FocusControls({ phase, isPaused, onPause, onResume, onSkip, onEnd }: FocusControlsProps) {
  const { t } = useTranslation();
  if (phase === "idle") return null;

  return (
    <div
      className="sc-commandes flex flex-col gap-2 p-3 relative sm:flex-row sm:items-center sm:gap-3"
      style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
    >
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/60" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/60" aria-hidden="true" />

      <div className="ds-t-label font-mono text-primary/50 uppercase tracking-[0.2em] mb-1 sm:mb-0 sm:hidden" aria-hidden="true">
        {t("focus.controls.overrideControls")}
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-2 sm:flex-1">
        <button
          onClick={isPaused ? onResume : onPause}
          className={cn("cyb", isPaused && "cyb--or")}
        >
          {isPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
          <span>{isPaused ? t("focus.controls.resume") : t("focus.controls.halt")}</span>
          <kbd>(space)</kbd>
        </button>

        <button onClick={onSkip} className="cyb cyb--icone" title={t("focus.skipPhase")}>
          <SkipForward className="h-4 w-4" aria-hidden="true" />
          <kbd aria-hidden="true">⇧S</kbd>
        </button>

        {/* Noter ce qui vous detourne fait partie du pilotage d une
            seance : le carnet appartient a cette barre, pas a un coin
            de l ecran deja occupe par le declencheur de M.I.A. */}
        <FocusDistractionButton />
      </div>

      <button onClick={onEnd} className="cyb cyb--danger w-full sm:w-auto mt-1 sm:mt-0">
        <Square className="h-3 w-3" aria-hidden="true" />
        <span>{t("focus.controls.abort")}</span>
        <kbd aria-hidden="true">(esc)</kbd>
      </button>
    </div>
  );
}
