import { useMemo, useState } from "react";
import { differenceInDays, format, isAfter, isBefore, isValid, parseISO } from "date-fns";
import { Calendar, Clock, Target, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PactTimelineProps {
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  hideBackgroundLines?: boolean;
}

export function PactTimeline({ projectStartDate, projectEndDate, hideBackgroundLines }: PactTimelineProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

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
      <div className="relative group animate-fade-in">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
        
        <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-6 overflow-hidden hover:border-primary/50 transition-all">
          {/* Double border effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
          </div>
          
          <div className="relative z-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary/60">
              <Calendar className="h-5 w-5" />
              <span className="font-orbitron text-xs uppercase tracking-widest">Pact Timeline</span>
            </div>
            <p className="text-primary/50 font-rajdhani text-sm">
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
        </div>
      </div>
    );
  }

  const { start, end, elapsedDays, remainingDays, progressRatio, status, totalDays } = timelineData;
  const progressPercent = Math.round(progressRatio * 100);
  const isNearEnd = progressRatio > 0.8;

  return (
    <div className="relative group animate-fade-in">
      {/* Outer glow - intensifies near deadline */}
      <div className={cn(
        "absolute inset-0 rounded-lg blur-xl transition-all duration-500 group-hover:blur-2xl",
        isNearEnd ? "bg-accent/15" : "bg-primary/5"
      )} />
      
      {/* Main card - consistent with other modules */}
      <div className={cn(
        "relative bg-card/20 backdrop-blur-xl border-2 rounded-lg overflow-hidden transition-all",
        isNearEnd 
          ? "border-accent/40 hover:border-accent/60" 
          : "border-primary/30 hover:border-primary/50"
      )}>
        {/* Double border effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn(
            "absolute inset-[2px] border rounded-[6px]",
            isNearEnd ? "border-accent/15" : "border-primary/20"
          )} />
        </div>

        {/* Header Section */}
        <div className={cn(
          "relative z-10 p-6 pb-4 border-b transition-colors",
          isNearEnd ? "border-accent/20" : "border-primary/20"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "relative p-2 rounded-lg transition-all",
                isNearEnd 
                  ? "bg-accent/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                  : "bg-primary/10 shadow-[0_0_15px_rgba(91,180,255,0.2)]"
              )}>
                {/* Icon glow pulse for active state */}
                {status === "active" && (
                  <div className={cn(
                    "absolute inset-0 rounded-lg animate-pulse",
                    isNearEnd ? "bg-accent/20" : "bg-primary/20"
                  )} />
                )}
                <Clock className={cn(
                  "h-5 w-5 relative z-10",
                  isNearEnd ? "text-accent" : "text-primary"
                )} />
              </div>
              <div>
                <h3 className="font-orbitron text-xs uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                  Pact Timeline
                </h3>
                <p className="text-primary/50 font-rajdhani text-[10px] mt-0.5">
                  {totalDays} day journey
                </p>
              </div>
            </div>
            
            {/* Status badge */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all",
              status === "active" && !isNearEnd && "text-primary bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(91,180,255,0.2)]",
              status === "active" && isNearEnd && "text-accent bg-accent/10 border-accent/30 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse",
              status === "not_started" && "text-muted-foreground bg-muted/10 border-muted/30",
              status === "expired" && "text-health bg-health/10 border-health/30 shadow-[0_0_10px_rgba(74,222,128,0.3)]"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                status === "active" && !isNearEnd && "bg-primary animate-pulse",
                status === "active" && isNearEnd && "bg-accent",
                status === "not_started" && "bg-muted-foreground",
                status === "expired" && "bg-health"
              )} />
              <span className="text-[10px] font-orbitron uppercase tracking-wider">
                {status === "active" && (isNearEnd ? "Final Push" : "In Progress")}
                {status === "not_started" && "Awaiting"}
                {status === "expired" && "Complete"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="relative z-10 p-6 pt-5 space-y-4">
          {/* Visual Timeline with nodes */}
          <div className="relative">
            {/* Timeline track */}
            <div className="relative h-3 w-full bg-card/40 rounded-full overflow-visible border border-primary/20">
              {/* Background shimmer */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent rounded-full" 
                style={{ backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }} 
              />
              
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
                    ? '0 0 20px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.2)'
                    : '0 0 20px rgba(91,180,255,0.5), 0 0 40px rgba(91,180,255,0.2)'
                }}
              >
                {/* Gloss overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/30 rounded-full" />
              </div>
              
              {/* Today marker - floating above */}
              {status === "active" && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-1000"
                  style={{ left: `${progressPercent}%` }}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 -translate-x-1/2 transition-all",
                    isNearEnd 
                      ? "bg-accent border-accent/80 shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                      : "bg-primary border-primary/80 shadow-[0_0_15px_rgba(91,180,255,0.8)]"
                  )}>
                    {/* Inner pulse */}
                    <div className={cn(
                      "absolute inset-0 rounded-full animate-ping",
                      isNearEnd ? "bg-accent/40" : "bg-primary/40"
                    )} />
                  </div>
                </div>
              )}
            </div>

            {/* Date nodes - Start, Today, End */}
            <div className="flex justify-between items-start mt-4">
              {/* Start Node */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-primary/60 shadow-[0_0_6px_rgba(91,180,255,0.4)]" />
                  <span className="text-[10px] font-orbitron text-primary/50 uppercase tracking-wider">Start</span>
                </div>
                <span className="text-sm font-orbitron text-primary font-medium">
                  {format(start, "MMM d")}
                </span>
                <span className="text-[10px] font-rajdhani text-primary/40">
                  {format(start, "yyyy")}
                </span>
              </div>

              {/* Center - Progress percentage */}
              <div className="flex flex-col items-center -mt-1">
                <div className={cn(
                  "text-2xl font-bold font-orbitron transition-colors",
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

              {/* End Node */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] font-orbitron uppercase tracking-wider",
                    isNearEnd ? "text-accent/70" : "text-primary/50"
                  )}>Target</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    isNearEnd 
                      ? "bg-accent/60 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                      : "bg-primary/60 shadow-[0_0_6px_rgba(91,180,255,0.4)]"
                  )} />
                </div>
                <span className={cn(
                  "text-sm font-orbitron font-medium",
                  isNearEnd ? "text-accent" : "text-primary"
                )}>
                  {format(end, "MMM d")}
                </span>
                <span className="text-[10px] font-rajdhani text-primary/40">
                  {format(end, "yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Details */}
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            isExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className={cn(
              "grid grid-cols-2 gap-3 pt-3 border-t",
              isNearEnd ? "border-accent/20" : "border-primary/20"
            )}>
              {/* Elapsed stat */}
              <div className="relative p-3 rounded-lg bg-card/30 border border-primary/20 hover:border-primary/40 transition-all group/stat">
                <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="text-[10px] font-orbitron text-primary/50 uppercase tracking-wider mb-1">Days Elapsed</div>
                  <div className="text-xl font-bold font-orbitron text-primary drop-shadow-[0_0_10px_rgba(91,180,255,0.3)]">
                    {elapsedDays}
                  </div>
                </div>
              </div>
              
              {/* Remaining stat */}
              <div className={cn(
                "relative p-3 rounded-lg bg-card/30 border transition-all group/stat",
                isNearEnd 
                  ? "border-accent/30 hover:border-accent/50"
                  : "border-primary/20 hover:border-primary/40"
              )}>
                <div className={cn(
                  "absolute inset-0 rounded-lg opacity-0 group-hover/stat:opacity-100 transition-opacity",
                  isNearEnd ? "bg-accent/5" : "bg-primary/5"
                )} />
                <div className="relative z-10">
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
            </div>
          </div>

          {/* Toggle / Status Bar */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all group/toggle",
              "hover:bg-primary/5 active:scale-[0.99]",
              status === "active" && !isNearEnd && "bg-primary/5 border-primary/20",
              status === "active" && isNearEnd && "bg-accent/5 border-accent/20",
              status === "not_started" && "bg-muted/5 border-muted/20",
              status === "expired" && "bg-health/5 border-health/20"
            )}
          >
            {status === "active" && (
              <>
                <span className="text-primary/60 font-rajdhani text-sm">{elapsedDays} days elapsed</span>
                <ArrowRight className="h-3 w-3 text-primary/40" />
                <span className={cn(
                  "font-orbitron font-semibold text-sm",
                  isNearEnd ? "text-accent" : "text-primary"
                )}>
                  {remainingDays} remaining
                </span>
              </>
            )}
            {status === "not_started" && (
              <span className="text-muted-foreground font-rajdhani text-sm">
                Pact phase begins {format(start, "MMM d, yyyy")}
              </span>
            )}
            {status === "expired" && (
              <span className="text-health font-rajdhani text-sm">
                ✓ This phase of your Pact is complete
              </span>
            )}
            
            {/* Expand/collapse indicator */}
            <div className={cn(
              "ml-2 transition-transform duration-300",
              isExpanded && "rotate-180"
            )}>
              <ChevronDown className={cn(
                "h-4 w-4 transition-colors",
                isNearEnd ? "text-accent/60" : "text-primary/60"
              )} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
