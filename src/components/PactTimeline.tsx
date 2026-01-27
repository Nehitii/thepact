import { useMemo, useState } from "react";
import { differenceInDays, format, isAfter, isBefore, isValid, parseISO } from "date-fns";
import { Calendar, Clock, Target, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardWidgetShell, WidgetDisplayMode } from "@/components/home/DashboardWidgetShell";

interface PactTimelineProps {
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
  hideBackgroundLines?: boolean;
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
    if (!projectStartDate || !projectEndDate) {
      return { status: "not_configured" as const };
    }

    const start = parseISO(projectStartDate);
    const end = parseISO(projectEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!isValid(start) || !isValid(end)) {
      return { status: "not_configured" as const };
    }

    if (!isAfter(end, start)) {
      return { status: "invalid" as const };
    }

    const totalDays = Math.max(1, differenceInDays(end, start));
    const elapsedDays = Math.max(0, Math.min(totalDays, differenceInDays(today, start)));
    const remainingDays = Math.max(0, differenceInDays(end, today));
    const progressRatio = elapsedDays / totalDays;

    if (isBefore(today, start)) {
      return {
        status: "not_started" as const,
        start,
        end,
        totalDays,
        elapsedDays: 0,
        remainingDays: totalDays,
        progressRatio: 0,
      };
    }

    if (isAfter(today, end)) {
      return {
        status: "expired" as const,
        start,
        end,
        totalDays,
        elapsedDays: totalDays,
        remainingDays: 0,
        progressRatio: 1,
      };
    }

    return {
      status: "active" as const,
      start,
      end,
      totalDays,
      elapsedDays,
      remainingDays,
      progressRatio,
    };
  }, [projectStartDate, projectEndDate]);

  // Not configured state
  if (timelineData.status === "not_configured" || timelineData.status === "invalid") {
    return (
      <DashboardWidgetShell
        title="Pact Timeline"
        icon={Calendar}
        displayMode={displayMode}
        onToggleDisplayMode={onToggleDisplayMode}
        showDisplayModeToggle={false}
        accentColor="primary"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-primary/50 font-rajdhani text-sm mb-3">
            No project timeline set yet.
          </p>
          <Button
            onClick={() => navigate("/profile")}
            variant="outline"
            className="bg-primary/10 border-primary/30 hover:border-primary/50 hover:bg-primary/20 text-primary font-orbitron text-xs uppercase tracking-wider"
          >
            <Target className="h-4 w-4 mr-2" />
            Set dates in Pact Settings
          </Button>
        </div>
      </DashboardWidgetShell>
    );
  }

  const { start, end, elapsedDays, remainingDays, progressRatio, status, totalDays } = timelineData;
  const progressPercent = Math.round(progressRatio * 100);
  const isNearEnd = progressRatio > 0.8;

  const detailedStats = (
    <div className="grid grid-cols-2 gap-3">
      {/* Elapsed stat */}
      <div className="p-3 rounded-lg bg-card/30 border border-primary/20">
        <div className="text-[10px] font-orbitron text-primary/50 uppercase tracking-wider mb-1">Days Elapsed</div>
        <div className="text-xl font-bold font-orbitron text-primary drop-shadow-[0_0_10px_rgba(91,180,255,0.3)]">
          {elapsedDays}
        </div>
      </div>
      
      {/* Remaining stat */}
      <div className={cn(
        "p-3 rounded-lg bg-card/30 border",
        isNearEnd ? "border-accent/30" : "border-primary/20"
      )}>
        <div className={cn(
          "text-[10px] font-orbitron uppercase tracking-wider mb-1",
          isNearEnd ? "text-accent/60" : "text-primary/50"
        )}>Days Remaining</div>
        <div className={cn(
          "text-xl font-bold font-orbitron",
          isNearEnd 
            ? "text-accent drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]"
            : "text-primary drop-shadow-[0_0_10px_rgba(91,180,255,0.3)]"
        )}>
          {remainingDays}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardWidgetShell
      title="Pact Timeline"
      icon={Clock}
      subtitle={`${totalDays} day journey`}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      expandableContent={!isCompact ? detailedStats : undefined}
      accentColor={isNearEnd ? "accent" : "primary"}
    >
      <div className="flex-1 flex flex-col justify-center">
        {/* Progress percentage */}
        <div className="text-center mb-4">
          <div className={cn(
            "text-3xl font-bold font-orbitron transition-colors",
            isNearEnd 
              ? "text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              : "text-primary drop-shadow-[0_0_15px_rgba(91,180,255,0.5)]"
          )}>
            {progressPercent}%
          </div>
          <span className="text-[10px] font-rajdhani text-primary/50 uppercase tracking-wide">
            Complete
          </span>
        </div>

        {/* Timeline track */}
        <div className="relative h-3 w-full bg-card/40 rounded-full overflow-visible border border-primary/20 mb-4">
          {/* Progress fill with glow */}
          <div
            className={cn(
              "h-full relative transition-all duration-1000 ease-out rounded-full",
              isNearEnd 
                ? "bg-gradient-to-r from-primary via-accent to-accent"
                : "bg-gradient-to-r from-primary via-accent to-primary"
            )}
            style={{ 
              width: `${progressPercent}%`,
              boxShadow: isNearEnd 
                ? '0 0 20px rgba(245,158,11,0.5)'
                : '0 0 20px rgba(91,180,255,0.5)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/30 rounded-full" />
          </div>
          
          {/* Today marker */}
          {status === "active" && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-1000"
              style={{ left: `${progressPercent}%` }}
            >
              <div className={cn(
                "w-4 h-4 rounded-full border-2 -translate-x-1/2",
                isNearEnd 
                  ? "bg-accent border-accent/80 shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                  : "bg-primary border-primary/80 shadow-[0_0_15px_rgba(91,180,255,0.8)]"
              )}>
                <div className={cn(
                  "absolute inset-0 rounded-full animate-ping",
                  isNearEnd ? "bg-accent/40" : "bg-primary/40"
                )} />
              </div>
            </div>
          )}
        </div>

        {/* Date labels */}
        <div className="flex justify-between items-start text-center">
          <div>
            <span className="text-xs font-orbitron text-primary font-medium">
              {format(start, "MMM d")}
            </span>
            <span className="block text-[10px] font-rajdhani text-primary/40">
              Start
            </span>
          </div>
          
          {/* Status badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full border backdrop-blur-sm",
            status === "active" && !isNearEnd && "text-primary bg-primary/10 border-primary/30",
            status === "active" && isNearEnd && "text-accent bg-accent/10 border-accent/30 animate-pulse",
            status === "not_started" && "text-muted-foreground bg-muted/10 border-muted/30",
            status === "expired" && "text-health bg-health/10 border-health/30"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              status === "active" && !isNearEnd && "bg-primary animate-pulse",
              status === "active" && isNearEnd && "bg-accent",
              status === "not_started" && "bg-muted-foreground",
              status === "expired" && "bg-health"
            )} />
            <span className="text-[9px] font-orbitron uppercase tracking-wider">
              {status === "active" && (isNearEnd ? "Final Push" : "Active")}
              {status === "not_started" && "Awaiting"}
              {status === "expired" && "Complete"}
            </span>
          </div>

          <div>
            <span className={cn(
              "text-xs font-orbitron font-medium",
              isNearEnd ? "text-accent" : "text-primary"
            )}>
              {format(end, "MMM d")}
            </span>
            <span className="block text-[10px] font-rajdhani text-primary/40">
              Target
            </span>
          </div>
        </div>
      </div>
    </DashboardWidgetShell>
  );
}
