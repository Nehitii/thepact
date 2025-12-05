import { useMemo } from "react";
import { differenceInDays, format, isAfter, isBefore, isValid, parseISO } from "date-fns";
import { Calendar, Clock, Target, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PactTimelineProps {
  projectStartDate?: string | null;
  projectEndDate?: string | null;
}

export function PactTimeline({ projectStartDate, projectEndDate }: PactTimelineProps) {
  const navigate = useNavigate();

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
        <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl" />
        <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/20 rounded-xl p-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[2px] border border-primary/10 rounded-[10px]" />
          </div>
          
          <div className="relative z-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary/60">
              <Calendar className="h-5 w-5" />
              <span className="font-orbitron text-sm uppercase tracking-wider">Pact Timeline</span>
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

  const { start, end, elapsedDays, remainingDays, progressRatio, status } = timelineData;
  const progressPercent = Math.round(progressRatio * 100);
  const isNearEnd = progressRatio > 0.8;

  return (
    <div className="relative group animate-fade-in">
      {/* Glow effect - stronger near deadline */}
      <div className={cn(
        "absolute inset-0 rounded-xl blur-xl transition-all duration-500",
        isNearEnd ? "bg-accent/20" : "bg-primary/10",
        "group-hover:blur-2xl"
      )} />
      
      <div className={cn(
        "relative backdrop-blur-xl border-2 rounded-xl p-6 overflow-hidden transition-all",
        isNearEnd 
          ? "bg-card/40 border-accent/40" 
          : "bg-card/30 border-primary/30"
      )}>
        {/* Inner border */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn(
            "absolute inset-[2px] border rounded-[10px]",
            isNearEnd ? "border-accent/20" : "border-primary/20"
          )} />
        </div>

        {/* Animated particles for near-end state */}
        {isNearEnd && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-accent/60 rounded-full animate-pulse"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "h-5 w-5",
                isNearEnd ? "text-accent animate-pulse" : "text-primary"
              )} />
              <span className="font-orbitron text-sm uppercase tracking-wider text-primary">
                Pact Timeline
              </span>
            </div>
            <span className={cn(
              "text-xs font-rajdhani uppercase tracking-wide px-2 py-1 rounded-full border",
              status === "active" && "text-primary/80 bg-primary/10 border-primary/20",
              status === "not_started" && "text-muted-foreground bg-muted/10 border-muted/20",
              status === "expired" && "text-accent bg-accent/10 border-accent/20"
            )}>
              {status === "active" && "In Progress"}
              {status === "not_started" && "Not Started"}
              {status === "expired" && "Complete"}
            </span>
          </div>

          {/* Timeline Bar */}
          <div className="space-y-2">
            <div className="relative h-4 w-full bg-card/40 rounded-full overflow-hidden border border-primary/20">
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" 
                style={{ backgroundSize: '200% auto' }} 
              />
              
              {/* Progress fill */}
              <div
                className={cn(
                  "h-full relative transition-all duration-1000 rounded-full",
                  isNearEnd 
                    ? "bg-gradient-to-r from-primary via-accent to-accent shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                    : "bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_20px_rgba(91,180,255,0.5)]"
                )}
                style={{ width: `${progressPercent}%` }}
              >
                {/* Gloss effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-white/30 rounded-full" />
                
                {/* Today marker */}
                {status === "active" && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
                )}
              </div>
            </div>

            {/* Date labels */}
            <div className="flex justify-between items-center text-xs">
              <div className="flex flex-col">
                <span className="text-primary/50 font-rajdhani uppercase tracking-wide">Start</span>
                <span className="text-primary font-orbitron">{format(start, "MMM d, yyyy")}</span>
              </div>
              
              {status === "active" && (
                <div className="flex flex-col items-center">
                  <span className="text-primary/50 font-rajdhani uppercase tracking-wide">Today</span>
                  <span className="text-primary/80 font-orbitron text-[10px]">{progressPercent}%</span>
                </div>
              )}
              
              <div className="flex flex-col items-end">
                <span className="text-primary/50 font-rajdhani uppercase tracking-wide">End</span>
                <span className={cn(
                  "font-orbitron",
                  isNearEnd ? "text-accent" : "text-primary"
                )}>{format(end, "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className={cn(
            "flex items-center justify-center gap-2 py-2 rounded-lg border",
            status === "active" && "bg-primary/5 border-primary/20",
            status === "not_started" && "bg-muted/5 border-muted/20",
            status === "expired" && "bg-accent/5 border-accent/20"
          )}>
            {status === "active" && (
              <>
                <span className="text-primary/70 font-rajdhani">{elapsedDays} days elapsed</span>
                <ArrowRight className="h-3 w-3 text-primary/40" />
                <span className={cn(
                  "font-orbitron font-semibold",
                  isNearEnd ? "text-accent" : "text-primary"
                )}>
                  {remainingDays} days remaining
                </span>
              </>
            )}
            {status === "not_started" && (
              <span className="text-muted-foreground font-rajdhani">
                Pact phase has not started yet
              </span>
            )}
            {status === "expired" && (
              <span className="text-accent font-rajdhani">
                This phase of your Pact is complete
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
