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
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Pact Settings
          </CardTitle>
          <CardDescription>Configure your pact timeline and progression</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectStartDate">Project Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !projectStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {projectStartDate ? format(projectStartDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={projectStartDate}
                  onSelect={onProjectStartDateChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Marks when you started your pact journey
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Custom Difficulty
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="customDifficultyName">Name</Label>
              <Input
                id="customDifficultyName"
                placeholder="Choose a name for your Custom Difficulty"
                value={customDifficultyName}
                onChange={(e) => onCustomDifficultyNameChange(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customDifficultyColor">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="customDifficultyColor"
                  type="color"
                  value={customDifficultyColor}
                  onChange={(e) => onCustomDifficultyColorChange(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <div className="flex-1">
                  <Input
                    type="text"
                    value={customDifficultyColor}
                    onChange={(e) => onCustomDifficultyColorChange(e.target.value)}
                    placeholder="#a855f7"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-4 rounded-lg border border-border/50 p-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="customDifficultyActive" className="text-base">
                  Activate Custom Difficulty
                </Label>
                <p className="text-sm text-muted-foreground">
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

      <RanksManager userId={userId} />
    </>
  );
}