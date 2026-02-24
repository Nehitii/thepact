import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataPanel } from "./settings-ui";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectTimelineCardProps {
  pactId: string | null;
  projectStartDate: Date | undefined;
  projectEndDate: Date | undefined;
  onProjectStartDateChange: (date: Date | undefined) => void;
  onProjectEndDateChange: (date: Date | undefined) => void;
}

const CY_BTN = [
  "relative rounded-none bg-primary/10 border border-primary/35",
  "hover:bg-primary/18 hover:border-primary/65",
  "text-primary font-mono text-[10px] tracking-[0.22em] uppercase",
  "shadow-[0_0_14px_hsl(var(--primary)/0.12)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.28)]",
  "disabled:opacity-30 disabled:cursor-not-allowed",
  "transition-all duration-200 h-10",
].join(" ");

export function ProjectTimelineCard({
  pactId,
  projectStartDate,
  projectEndDate,
  onProjectStartDateChange,
  onProjectEndDateChange,
}: ProjectTimelineCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const dateValidationError = projectStartDate && projectEndDate && projectEndDate <= projectStartDate
    ? "End date must be after start date."
    : null;

  const handleSave = async () => {
    if (dateValidationError) {
      toast({ title: "Validation Error", description: dateValidationError, variant: "destructive" });
      return;
    }
    if (!pactId) {
      toast({ title: "Error", description: "No pact found to update.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("pacts")
      .update({
        project_start_date: projectStartDate ? projectStartDate.toISOString().split('T')[0] : null,
        project_end_date: projectEndDate ? projectEndDate.toISOString().split('T')[0] : null,
      })
      .eq("id", pactId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["pact"] });
      toast({ title: "Timeline Updated", description: "Your project timeline has been saved." });
    }
    setSaving(false);
  };

  const formatDisplayDate = (date: Date | undefined) => {
    if (!date) return null;
    return format(date, "MMM d, yyyy");
  };

  return (
    <DataPanel
      code="MODULE_03"
      title="PROJECT TIMELINE"
      footerLeft={<span>START: <b className="text-primary">{projectStartDate ? formatDisplayDate(projectStartDate) : "—"}</b></span>}
      footerRight={<span>END: <b className="text-primary">{projectEndDate ? formatDisplayDate(projectEndDate) : "—"}</b></span>}
    >
      <div className="py-4 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex-1 h-px bg-gradient-to-r from-primary/60 via-primary/40 to-primary/20" />
          <ArrowRight className="h-4 w-4 text-primary/60 flex-shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
              <label className="text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Start Date</label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between px-3 h-11",
                    "bg-[#010608] border border-primary/25",
                    "hover:border-primary/50 hover:bg-[#010b10]",
                    "text-primary/80 font-mono text-sm tracking-wide",
                    "transition-all duration-200",
                    !projectStartDate && "text-primary/20",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary/35 shrink-0" />
                    {projectStartDate ? formatDisplayDate(projectStartDate) : "Select start"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#020c12]/99 backdrop-blur-2xl rounded-none border border-primary/20" align="start">
                <Calendar mode="single" selected={projectStartDate} onSelect={onProjectStartDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
              <label className="text-[9px] uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">End Date</label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between px-3 h-11",
                    "bg-[#010608] border border-primary/25",
                    "hover:border-primary/50 hover:bg-[#010b10]",
                    "text-primary/80 font-mono text-sm tracking-wide",
                    "transition-all duration-200",
                    !projectEndDate && "text-primary/20",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary/35 shrink-0" />
                    {projectEndDate ? formatDisplayDate(projectEndDate) : "Select end"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#020c12]/99 backdrop-blur-2xl rounded-none border border-primary/20" align="start">
                <Calendar mode="single" selected={projectEndDate} onSelect={onProjectEndDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {dateValidationError && (
          <p className="text-[9px] text-destructive font-mono tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />{dateValidationError}
          </p>
        )}

        <button onClick={handleSave} disabled={saving || !!dateValidationError} className={cn(CY_BTN, "w-full flex items-center justify-center gap-2")}>
          {saving ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />SAVING…</>) : "[ SAVE TIMELINE ]"}
        </button>
      </div>
    </DataPanel>
  );
}
