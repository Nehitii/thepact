import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PactSettingsCard } from "./PactSettingsCard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectTimelineCardProps {
  pactId: string | null;
  projectStartDate: Date | undefined;
  projectEndDate: Date | undefined;
  onProjectStartDateChange: (date: Date | undefined) => void;
  onProjectEndDateChange: (date: Date | undefined) => void;
}

export function ProjectTimelineCard({
  pactId,
  projectStartDate,
  projectEndDate,
  onProjectStartDateChange,
  onProjectEndDateChange,
}: ProjectTimelineCardProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const dateValidationError = projectStartDate && projectEndDate && projectEndDate <= projectStartDate
    ? "End date must be after start date."
    : null;

  const handleSave = async () => {
    if (dateValidationError) {
      toast({
        title: "Validation Error",
        description: dateValidationError,
        variant: "destructive",
      });
      return;
    }

    if (!pactId) {
      toast({
        title: "Error",
        description: "No pact found to update.",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Timeline Updated",
        description: "Your project timeline has been saved.",
      });
    }

    setSaving(false);
  };

  // Format date for display - shorter format to prevent overflow
  const formatDisplayDate = (date: Date | undefined) => {
    if (!date) return null;
    return format(date, "MMM d, yyyy");
  };

  return (
    <PactSettingsCard
      icon={<Clock className="h-5 w-5 text-primary" />}
      title="Project Timeline"
      description="Set your pact journey start and end dates"
    >
      <div className="space-y-4">
        {/* Timeline Visual */}
        <div className="flex items-center gap-2 px-2">
          <div className="flex-1 h-1 bg-gradient-to-r from-primary/60 via-primary/40 to-primary/20 rounded-full" />
          <ArrowRight className="h-4 w-4 text-primary/60 flex-shrink-0" />
        </div>

        {/* Date Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground font-orbitron uppercase tracking-widest flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              Start Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal px-3",
                    "bg-gradient-to-r from-[#0a1525]/80 to-[#0d1a2d]/80",
                    "border border-primary/30 rounded-lg",
                    "text-foreground font-rajdhani text-sm",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "focus:ring-1 focus:ring-primary/50",
                    !projectStartDate && "text-muted-foreground/60"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                  <span className="truncate">
                    {projectStartDate ? formatDisplayDate(projectStartDate) : "Select start"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 z-[100] bg-[#0a1525] border-primary/40 shadow-[0_0_30px_rgba(91,180,255,0.2)]" 
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={projectStartDate}
                  onSelect={onProjectStartDateChange}
                  initialFocus
                  className="pointer-events-auto bg-[#0a1525]"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground font-orbitron uppercase tracking-widest flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/30" />
              End Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal px-3",
                    "bg-gradient-to-r from-[#0a1525]/80 to-[#0d1a2d]/80",
                    "border border-primary/30 rounded-lg",
                    "text-foreground font-rajdhani text-sm",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "focus:ring-1 focus:ring-primary/50",
                    !projectEndDate && "text-muted-foreground/60"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                  <span className="truncate">
                    {projectEndDate ? formatDisplayDate(projectEndDate) : "Select end"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 z-[100] bg-[#0a1525] border-primary/40 shadow-[0_0_30px_rgba(91,180,255,0.2)]" 
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={projectEndDate}
                  onSelect={onProjectEndDateChange}
                  initialFocus
                  className="pointer-events-auto bg-[#0a1525]"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Validation Error */}
        {dateValidationError && (
          <p className="text-xs text-destructive font-rajdhani px-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            {dateValidationError}
          </p>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving || !!dateValidationError}
          className={cn(
            "w-full h-10 font-orbitron uppercase tracking-wider text-xs",
            "bg-primary/20 border border-primary/40 rounded-lg",
            "text-primary hover:bg-primary/30 hover:border-primary/60",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200"
          )}
        >
          {saving ? "SAVING..." : "SAVE TIMELINE"}
        </Button>
      </div>
    </PactSettingsCard>
  );
}
