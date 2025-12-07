import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PactSettingsCard } from "./PactSettingsCard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
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

  return (
    <PactSettingsCard
      icon={<Clock className="h-5 w-5 text-primary" />}
      title="Project Timeline"
      description="Set your pact journey start and end dates"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground font-orbitron uppercase tracking-widest">
            Start Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-normal",
                  "bg-secondary/50 border-2 border-primary/40 rounded-lg",
                  "text-foreground font-orbitron text-sm",
                  "hover:border-primary/60 hover:bg-secondary/70",
                  "focus:ring-2 focus:ring-primary/50",
                  !projectStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                {projectStartDate ? format(projectStartDate, "PPP") : "Pick start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={projectStartDate}
                onSelect={onProjectStartDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground font-orbitron uppercase tracking-widest">
            End Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-normal",
                  "bg-secondary/50 border-2 border-primary/40 rounded-lg",
                  "text-foreground font-orbitron text-sm",
                  "hover:border-primary/60 hover:bg-secondary/70",
                  "focus:ring-2 focus:ring-primary/50",
                  !projectEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                {projectEndDate ? format(projectEndDate, "PPP") : "Pick end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={projectEndDate}
                onSelect={onProjectEndDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {dateValidationError && (
        <p className="text-sm text-destructive font-rajdhani">
          {dateValidationError}
        </p>
      )}

      <Button
        onClick={handleSave}
        disabled={saving || !!dateValidationError}
        className={cn(
          "w-full h-11 font-orbitron uppercase tracking-wider text-sm",
          "bg-primary/20 border-2 border-primary/40 rounded-lg",
          "text-primary hover:bg-primary/30 hover:border-primary/60",
          "transition-all duration-200"
        )}
      >
        {saving ? "SAVING..." : "SAVE TIMELINE"}
      </Button>
    </PactSettingsCard>
  );
}
