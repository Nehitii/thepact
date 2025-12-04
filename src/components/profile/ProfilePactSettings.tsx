import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ProfileMenuCard } from "./ProfileMenuCard";
import { RanksManager } from "@/components/RanksManager";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Zap, Calendar as CalendarIcon, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProfilePactSettingsProps {
  userId: string;
  pactId: string | null;
  projectStartDate: Date | undefined;
  projectEndDate: Date | undefined;
  customDifficultyName: string;
  customDifficultyActive: boolean;
  customDifficultyColor: string;
  onProjectStartDateChange: (date: Date | undefined) => void;
  onProjectEndDateChange: (date: Date | undefined) => void;
  onCustomDifficultyNameChange: (value: string) => void;
  onCustomDifficultyActiveChange: (value: boolean) => void;
  onCustomDifficultyColorChange: (value: string) => void;
}

export function ProfilePactSettings({
  userId,
  pactId,
  projectStartDate,
  projectEndDate,
  customDifficultyName,
  customDifficultyActive,
  customDifficultyColor,
  onProjectStartDateChange,
  onProjectEndDateChange,
  onCustomDifficultyNameChange,
  onCustomDifficultyActiveChange,
  onCustomDifficultyColorChange,
}: ProfilePactSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    // Update profile custom difficulty
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        custom_difficulty_name: customDifficultyName.trim() || null,
        custom_difficulty_active: customDifficultyActive,
        custom_difficulty_color: customDifficultyColor,
      })
      .eq("id", userId);

    // Update pact dates if pactId exists
    let pactError = null;
    if (pactId) {
      const { error } = await supabase
        .from("pacts")
        .update({
          project_start_date: projectStartDate ? projectStartDate.toISOString().split('T')[0] : null,
          project_end_date: projectEndDate ? projectEndDate.toISOString().split('T')[0] : null,
        })
        .eq("id", pactId);
      pactError = error;
    }

    if (profileError || pactError) {
      toast({
        title: "Error",
        description: profileError?.message || pactError?.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pact Settings Updated",
        description: "Your pact configuration has been saved",
      });
    }

    setSaving(false);
  };

  return (
    <ProfileMenuCard
      icon={<Target className="h-5 w-5 text-primary" />}
      title="Pact Settings"
      description="Configure your pact timeline and progression"
    >
      <div className="space-y-6">
        {/* Project Start Date */}
        <div className="space-y-2">
          <Label className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
            Project Start Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-card/50 border-primary/20 hover:border-primary/50 hover:bg-card/60 text-primary font-orbitron",
                  !projectStartDate && "text-primary/60"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {projectStartDate ? format(projectStartDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-primary/30 z-50" align="start">
              <Calendar
                mode="single"
                selected={projectStartDate}
                onSelect={onProjectStartDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-primary/50 font-rajdhani">
            Marks when you started your pact journey
          </p>
        </div>

        {/* Project End Date */}
        <div className="space-y-2">
          <Label className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
            Project End Date (Symbolic Deadline)
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-card/50 border-primary/20 hover:border-primary/50 hover:bg-card/60 text-primary font-orbitron",
                  !projectEndDate && "text-primary/60"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {projectEndDate ? format(projectEndDate, "PPP") : <span>Set your deadline</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-primary/30 z-50" align="start">
              <Calendar
                mode="single"
                selected={projectEndDate}
                onSelect={onProjectEndDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-primary/50 font-rajdhani">
            A symbolic deadline for your pact journey
          </p>
        </div>

        {/* Custom Difficulty Section */}
        <div className="space-y-4 pt-4 border-t border-primary/20">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-primary font-orbitron uppercase tracking-wider">
            <Zap className="h-4 w-4" />
            Custom Difficulty
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="customDifficultyName" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
              Name
            </Label>
            <Input
              id="customDifficultyName"
              placeholder="Choose a name for your Custom Difficulty"
              value={customDifficultyName}
              onChange={(e) => onCustomDifficultyNameChange(e.target.value)}
              maxLength={50}
              className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customDifficultyColor" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
              Color
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="customDifficultyColor"
                type="color"
                value={customDifficultyColor}
                onChange={(e) => onCustomDifficultyColorChange(e.target.value)}
                className="w-20 h-10 cursor-pointer border-primary/20"
              />
              <div className="flex-1">
                <Input
                  type="text"
                  value={customDifficultyColor}
                  onChange={(e) => onCustomDifficultyColorChange(e.target.value)}
                  placeholder="#a855f7"
                  maxLength={7}
                  className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between space-x-4 rounded-lg border border-primary/20 bg-card/30 p-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="customDifficultyActive" className="text-base text-primary font-rajdhani uppercase tracking-wide">
                Activate Custom Difficulty
              </Label>
              <p className="text-sm text-primary/60 font-rajdhani">
                {customDifficultyActive 
                  ? "Available in all goal creation and editing" 
                  : "Will not appear in difficulty selectors"}
              </p>
            </div>
            <Switch
              id="customDifficultyActive"
              checked={customDifficultyActive}
              onCheckedChange={onCustomDifficultyActiveChange}
            />
          </div>
        </div>

        {/* Ranks Manager */}
        <div className="pt-4 border-t border-primary/20">
          <RanksManager userId={userId} />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider"
        >
          {saving ? "SAVING..." : "SAVE CHANGES"}
        </Button>
      </div>
    </ProfileMenuCard>
  );
}
