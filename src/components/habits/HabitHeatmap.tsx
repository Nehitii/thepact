import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, eachDayOfInterval, subDays, startOfWeek, getDay } from "date-fns";

interface HabitHeatmapProps {
  data: Map<string, { count: number; completed: boolean }>;
  weeks?: number;
  className?: string;
}

const INTENSITY_COLORS = [
  "bg-white/5",           // 0 - empty
  "bg-emerald-900/60",    // 1
  "bg-emerald-700/70",    // 2
  "bg-emerald-500/80",    // 3
  "bg-emerald-400",       // 4+
];

function getIntensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

export function HabitHeatmap({ data, weeks = 20, className }: HabitHeatmapProps) {
  const { grid, months } = useMemo(() => {
    const today = new Date();
    const start = subDays(today, weeks * 7 - 1);
    const days = eachDayOfInterval({ start, end: today });

    // Build grid: columns = weeks, rows = 7 days (Mon-Sun)
    const grid: { date: string; count: number; dayOfWeek: number; weekIndex: number }[] = [];

    const weekStart = startOfWeek(start, { weekStartsOn: 1 });
    const totalDays = Math.ceil((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    for (let w = 0; w < totalWeeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + w * 7 + d);
        if (date > today) continue;
        if (date < start) continue;
        const dateStr = format(date, "yyyy-MM-dd");
        const entry = data.get(dateStr);
        grid.push({
          date: dateStr,
          count: entry?.count || 0,
          dayOfWeek: d,
          weekIndex: w,
        });
      }
    }

    // Extract month labels
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    for (const cell of grid) {
      const month = new Date(cell.date).getMonth();
      if (month !== lastMonth && cell.dayOfWeek === 0) {
        months.push({
          label: format(new Date(cell.date), "MMM"),
          weekIndex: cell.weekIndex,
        });
        lastMonth = month;
      }
    }

    return { grid, months };
  }, [data, weeks]);

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className={cn("overflow-x-auto", className)}>
      {/* Month labels */}
      <div className="flex ml-8 mb-1">
        {months.map((m, i) => (
          <div
            key={i}
            className="text-[10px] text-muted-foreground font-mono"
            style={{ marginLeft: i === 0 ? m.weekIndex * 14 : (m.weekIndex - (months[i - 1]?.weekIndex || 0)) * 14 - 20 }}
          >
            {m.label}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[12px] text-[9px] text-muted-foreground font-mono leading-[12px] w-6 text-right pr-1">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <TooltipProvider delayDuration={100}>
          <div className="flex gap-0.5">
            {Array.from(new Set(grid.map((c) => c.weekIndex))).map((weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const cell = grid.find((c) => c.weekIndex === weekIdx && c.dayOfWeek === dayIdx);
                  if (!cell) {
                    return <div key={dayIdx} className="w-[12px] h-[12px]" />;
                  }
                  const level = getIntensityLevel(cell.count);
                  return (
                    <Tooltip key={dayIdx}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-[12px] h-[12px] rounded-[2px] transition-colors cursor-default",
                            INTENSITY_COLORS[level]
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-bold">{format(new Date(cell.date), "MMM d, yyyy")}</p>
                        <p>{cell.count} habit{cell.count !== 1 ? "s" : ""} completed</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 ml-8">
        <span className="text-[10px] text-muted-foreground mr-1">Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div key={i} className={cn("w-[12px] h-[12px] rounded-[2px]", color)} />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">More</span>
      </div>
    </div>
  );
}
