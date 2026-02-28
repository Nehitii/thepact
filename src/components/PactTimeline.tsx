import { useMemo } from "react";
import { differenceInDays, format, isAfter, isBefore, isValid, parseISO } from "date-fns";
import { Calendar, Clock, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NeuralPanel, WidgetDisplayMode } from "@/components/home/NeuralPanel";

interface PactTimelineProps {
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
}

export function PactTimeline({ 
  projectStartDate, 
  projectEndDate, 
  displayMode = 'compact',
  onToggleDisplayMode,
}: PactTimelineProps) {
  const navigate = useNavigate();
  const isCompact = displayMode === 'compact';

  const timelineData = useMemo(() => {
    if (!projectStartDate || !projectEndDate) return { status: "not_configured" as const };
    const start = parseISO(projectStartDate);
    const end = parseISO(projectEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!isValid(start) || !isValid(end)) return { status: "not_configured" as const };
    if (!isAfter(end, start)) return { status: "invalid" as const };

    const totalDays = Math.max(1, differenceInDays(end, start));
    const elapsedDays = Math.max(0, Math.min(totalDays, differenceInDays(today, start)));
    const remainingDays = Math.max(0, differenceInDays(end, today));
    const progressRatio = elapsedDays / totalDays;

    if (isBefore(today, start)) {
      return { status: "not_started" as const, start, end, totalDays, elapsedDays: 0, remainingDays: totalDays, progressRatio: 0 };
    }
    if (isAfter(today, end)) {
      return { status: "expired" as const, start, end, totalDays, elapsedDays: totalDays, remainingDays: 0, progressRatio: 1 };
    }
    return { status: "active" as const, start, end, totalDays, elapsedDays, remainingDays, progressRatio };
  }, [projectStartDate, projectEndDate]);

  if (timelineData.status === "not_configured" || timelineData.status === "invalid") {
    return (
      <NeuralPanel title="Timeline" icon={Calendar} displayMode={displayMode} onToggleDisplayMode={onToggleDisplayMode}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-[rgba(160,210,255,0.3)] font-rajdhani text-sm mb-3">No timeline set.</p>
          <Button
            onClick={() => navigate("/profile/pact-settings")}
            variant="outline"
            className="bg-transparent border-[rgba(0,180,255,0.15)] hover:border-[rgba(0,180,255,0.3)] text-primary font-orbitron text-[9px] uppercase tracking-wider rounded-sm"
          >
            <Target className="h-3.5 w-3.5 mr-1.5" /> Set Dates
          </Button>
        </div>
      </NeuralPanel>
    );
  }

  const { start, end, elapsedDays, remainingDays, progressRatio, status, totalDays } = timelineData;
  const progressPercent = Math.round(progressRatio * 100);
  const isNearEnd = progressRatio > 0.8;

  const detailedStats = (
    <div className="grid grid-cols-2 gap-2">
      <div className="p-2.5 rounded-sm bg-[rgba(0,180,255,0.03)] border border-[rgba(0,180,255,0.08)]">
        <div className="text-[9px] font-orbitron text-[rgba(160,210,255,0.35)] uppercase tracking-wider mb-1">Elapsed</div>
        <div className="text-lg font-mono font-bold text-primary tabular-nums">{elapsedDays}</div>
      </div>
      <div className={cn(
        "p-2.5 rounded-sm border",
        isNearEnd ? "bg-[rgba(255,140,0,0.03)] border-[rgba(255,140,0,0.1)]" : "bg-[rgba(0,180,255,0.03)] border-[rgba(0,180,255,0.08)]"
      )}>
        <div className={cn("text-[9px] font-orbitron uppercase tracking-wider mb-1", isNearEnd ? "text-amber-400/50" : "text-[rgba(160,210,255,0.35)]")}>
          Remaining
        </div>
        <div className={cn("text-lg font-mono font-bold tabular-nums", isNearEnd ? "text-amber-400" : "text-primary")}>
          {remainingDays}
        </div>
      </div>
    </div>
  );

  return (
    <NeuralPanel
      title="Timeline"
      icon={Clock}
      subtitle={`${totalDays}d`}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={!isCompact ? detailedStats : undefined}
    >
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-3">
          <div className={cn(
            "text-2xl font-mono font-bold tabular-nums",
            isNearEnd ? "text-amber-400" : "text-primary"
          )}>
            {progressPercent}%
          </div>
          <span className="text-[10px] font-rajdhani text-[rgba(160,210,255,0.3)] uppercase">Complete</span>
        </div>

        <div className="relative h-2 w-full bg-[rgba(0,180,255,0.06)] rounded-full overflow-hidden mb-3">
          <div
            className={cn(
              "h-full transition-all duration-1000 ease-out rounded-full",
              isNearEnd ? "bg-amber-400/50" : "bg-primary/50"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono text-[rgba(160,210,255,0.5)] tabular-nums">{format(start, "MMM d")}</span>
            <span className="block text-[9px] text-[rgba(160,210,255,0.2)]">Start</span>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[9px] font-orbitron uppercase tracking-wider",
            status === "active" && !isNearEnd && "text-primary bg-[rgba(0,180,255,0.05)] border-[rgba(0,180,255,0.15)]",
            status === "active" && isNearEnd && "text-amber-400 bg-[rgba(255,140,0,0.05)] border-[rgba(255,140,0,0.15)]",
            status === "not_started" && "text-[rgba(160,210,255,0.3)] border-[rgba(0,180,255,0.08)]",
            status === "expired" && "text-emerald-400 border-[rgba(0,255,136,0.15)]"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              status === "active" && !isNearEnd && "bg-primary",
              status === "active" && isNearEnd && "bg-amber-400",
              status === "not_started" && "bg-[rgba(160,210,255,0.3)]",
              status === "expired" && "bg-emerald-400"
            )} />
            {status === "active" && (isNearEnd ? "Final" : "Active")}
            {status === "not_started" && "Awaiting"}
            {status === "expired" && "Done"}
          </div>
          <div className="text-right">
            <span className={cn("text-[10px] font-mono tabular-nums", isNearEnd ? "text-amber-400/60" : "text-[rgba(160,210,255,0.5)]")}>
              {format(end, "MMM d")}
            </span>
            <span className="block text-[9px] text-[rgba(160,210,255,0.2)]">Target</span>
          </div>
        </div>
      </div>
    </NeuralPanel>
  );
}
