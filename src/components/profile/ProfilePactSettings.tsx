import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { RanksManager } from "@/components/RanksManager";
import { Zap, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProfilePactSettingsProps {
  userId: string;
  projectStartDate: Date | undefined;
  customDifficultyName: string;
  customDifficultyActive: boolean;
  customDifficultyColor: string;
  onProjectStartDateChange: (date: Date | undefined) => void;
  onCustomDifficultyNameChange: (value: string) => void;
  onCustomDifficultyActiveChange: (value: boolean) => void;
  onCustomDifficultyColorChange: (value: string) => void;
}

export function ProfilePactSettings({
  userId,
  projectStartDate,
  customDifficultyName,
  customDifficultyActive,
  customDifficultyColor,
  onProjectStartDateChange,
  onCustomDifficultyNameChange,
  onCustomDifficultyActiveChange,
  onCustomDifficultyColorChange,
}: ProfilePactSettingsProps) {
  return (
    <>
      <div className="relative group animate-fade-in">
        <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
        <Card className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 hover:border-primary/50 transition-all overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-primary font-orbitron uppercase tracking-wider drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
              <CalendarIcon className="h-5 w-5" />
              Pact Settings
            </CardTitle>
            <CardDescription className="text-primary/60 font-rajdhani">Configure your pact timeline and progression</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="projectStartDate" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Project Start Date</Label>
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
                <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-primary/30" align="start">
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

            <div className="space-y-4 pt-4 border-t border-primary/20">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-primary font-orbitron uppercase tracking-wider">
                <Zap className="h-4 w-4" />
                Custom Difficulty
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="customDifficultyName" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Name</Label>
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
                <Label htmlFor="customDifficultyColor" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Color</Label>
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
          </CardContent>
        </Card>
      </div>

      <RanksManager userId={userId} />
    </>
  );
}