import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Ruler, 
  Weight,
  Moon,
  Activity,
  Brain,
  Droplets,
  Apple,
  AlertCircle,
} from "lucide-react";
import { useHealthSettings, useUpsertHealthSettings } from "@/hooks/useHealth";

interface HealthSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HealthSettingsModal({ open, onOpenChange }: HealthSettingsModalProps) {
  const { user } = useAuth();
  const { data: settings } = useHealthSettings(user?.id);
  const upsertSettings = useUpsertHealthSettings(user?.id);
  
  // Form state
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [showBmi, setShowBmi] = useState(false);
  const [showSleep, setShowSleep] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showStress, setShowStress] = useState(true);
  const [showHydration, setShowHydration] = useState(true);
  const [showNutrition, setShowNutrition] = useState(false);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [hydrationGoal, setHydrationGoal] = useState(8);
  const [activityGoal, setActivityGoal] = useState(30);

  // Load settings when modal opens
  useEffect(() => {
    if (settings) {
      setHeightCm(settings.height_cm?.toString() || "");
      setWeightKg(settings.weight_kg?.toString() || "");
      setShowBmi(settings.show_bmi);
      setShowSleep(settings.show_sleep);
      setShowActivity(settings.show_activity);
      setShowStress(settings.show_stress);
      setShowHydration(settings.show_hydration);
      setShowNutrition(settings.show_nutrition);
      setSleepGoal(settings.sleep_goal_hours || 8);
      setHydrationGoal(settings.hydration_goal_glasses || 8);
      setActivityGoal(settings.activity_goal_minutes || 30);
    }
  }, [settings]);

  const handleSave = async () => {
    await upsertSettings.mutateAsync({
      height_cm: heightCm ? parseFloat(heightCm) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      show_bmi: showBmi,
      show_sleep: showSleep,
      show_activity: showActivity,
      show_stress: showStress,
      show_hydration: showHydration,
      show_nutrition: showNutrition,
      sleep_goal_hours: sleepGoal,
      hydration_goal_glasses: hydrationGoal,
      activity_goal_minutes: activityGoal,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a1525] border-emerald-500/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Health Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* BMI Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">BMI Indicator</h3>
              <Switch 
                checked={showBmi} 
                onCheckedChange={setShowBmi}
              />
            </div>
            
            {showBmi && (
              <div className="space-y-3 pl-4 border-l-2 border-emerald-500/20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-2">
                  <AlertCircle className="w-3 h-3" />
                  BMI is indicative only and not a health measure
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Ruler className="w-3 h-3" /> Height (cm)
                    </Label>
                    <Input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="175"
                      className="bg-muted/30 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Weight className="w-3 h-3" /> Weight (kg)
                    </Label>
                    <Input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="70"
                      className="bg-muted/30 mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Separator className="bg-muted-foreground/10" />
          
          {/* Visible Sections */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Visible Sections</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Sleep & Recovery</span>
                </div>
                <Switch checked={showSleep} onCheckedChange={setShowSleep} />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">Activity & Movement</span>
                </div>
                <Switch checked={showActivity} onCheckedChange={setShowActivity} />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">Stress & Mental Load</span>
                </div>
                <Switch checked={showStress} onCheckedChange={setShowStress} />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">Hydration</span>
                </div>
                <Switch checked={showHydration} onCheckedChange={setShowHydration} />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Apple className="w-4 h-4 text-orange-400" />
                  <span className="text-sm">Nutrition Balance</span>
                </div>
                <Switch checked={showNutrition} onCheckedChange={setShowNutrition} />
              </div>
            </div>
          </div>
          
          <Separator className="bg-muted-foreground/10" />
          
          {/* Soft Goals */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Personal Targets</h3>
            <p className="text-xs text-muted-foreground/70">
              These are soft goals for guidance, not rigid requirements.
            </p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Sleep goal</span>
                  <span className="text-blue-400 font-medium">{sleepGoal}h</span>
                </div>
                <Slider
                  value={[sleepGoal]}
                  onValueChange={(v) => setSleepGoal(v[0])}
                  min={5}
                  max={10}
                  step={0.5}
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Hydration goal</span>
                  <span className="text-cyan-400 font-medium">{hydrationGoal} glasses</span>
                </div>
                <Slider
                  value={[hydrationGoal]}
                  onValueChange={(v) => setHydrationGoal(v[0])}
                  min={4}
                  max={16}
                  step={1}
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Activity goal</span>
                  <span className="text-emerald-400 font-medium">{activityGoal} min</span>
                </div>
                <Slider
                  value={[activityGoal]}
                  onValueChange={(v) => setActivityGoal(v[0])}
                  min={15}
                  max={120}
                  step={5}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-muted-foreground/10">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={upsertSettings.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {upsertSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
