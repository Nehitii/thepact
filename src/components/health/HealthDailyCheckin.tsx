import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Moon, 
  Activity, 
  Brain, 
  Droplets, 
  Apple,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodayHealth, useUpsertHealthData, useHealthSettings } from "@/hooks/useHealth";

interface HealthDailyCheckinProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { key: "sleep", icon: Moon, title: "Sleep & Recovery", color: "blue" },
  { key: "activity", icon: Activity, title: "Activity", color: "green" },
  { key: "stress", icon: Brain, title: "Mental Wellness", color: "purple" },
  { key: "hydration", icon: Droplets, title: "Hydration", color: "cyan" },
  { key: "notes", icon: Sparkles, title: "Notes (Optional)", color: "amber" },
];

const qualityLabels = ["Poor", "Fair", "Okay", "Good", "Great"];
const stressLabels = ["Minimal", "Low", "Moderate", "High", "Overwhelming"];

export function HealthDailyCheckin({ open, onOpenChange }: HealthDailyCheckinProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  
  const { data: todayData } = useTodayHealth(user?.id);
  const { data: settings } = useHealthSettings(user?.id);
  const upsertHealth = useUpsertHealthData(user?.id);
  
  // Form state
  const [sleepHours, setSleepHours] = useState<number>(todayData?.sleep_hours ?? 7);
  const [sleepQuality, setSleepQuality] = useState<number>(todayData?.sleep_quality ?? 3);
  const [wakeEnergy, setWakeEnergy] = useState<number>(todayData?.wake_energy ?? 3);
  const [activityLevel, setActivityLevel] = useState<number>(todayData?.activity_level ?? 3);
  const [movementMinutes, setMovementMinutes] = useState<number>(todayData?.movement_minutes ?? 30);
  const [stressLevel, setStressLevel] = useState<number>(todayData?.stress_level ?? 3);
  const [mentalLoad, setMentalLoad] = useState<number>(todayData?.mental_load ?? 3);
  const [hydrationGlasses, setHydrationGlasses] = useState<number>(todayData?.hydration_glasses ?? 4);
  const [mealBalance, setMealBalance] = useState<number>(todayData?.meal_balance ?? 3);
  const [notes, setNotes] = useState<string>(todayData?.notes ?? "");

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    await upsertHealth.mutateAsync({
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      wake_energy: wakeEnergy,
      activity_level: activityLevel,
      movement_minutes: movementMinutes,
      stress_level: stressLevel,
      mental_load: mentalLoad,
      hydration_glasses: hydrationGlasses,
      meal_balance: mealBalance,
      notes: notes || null,
    });
    onOpenChange(false);
    setCurrentStep(0);
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Sleep
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                How many hours did you sleep?
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[sleepHours]}
                  onValueChange={(v) => setSleepHours(v[0])}
                  min={0}
                  max={12}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-blue-400 w-16 text-right">
                  {sleepHours}h
                </span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Sleep quality
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSleepQuality(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      sleepQuality === value
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "border-muted-foreground/20 text-muted-foreground hover:border-blue-500/50"
                    )}
                  >
                    {qualityLabels[value - 1]}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Energy when you woke up
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setWakeEnergy(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      wakeEnergy === value
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "border-muted-foreground/20 text-muted-foreground hover:border-blue-500/50"
                    )}
                  >
                    {qualityLabels[value - 1]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 1: // Activity
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Overall activity level today
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setActivityLevel(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      activityLevel === value
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "border-muted-foreground/20 text-muted-foreground hover:border-emerald-500/50"
                    )}
                  >
                    {qualityLabels[value - 1]}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Approximate active minutes
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[movementMinutes]}
                  onValueChange={(v) => setMovementMinutes(v[0])}
                  min={0}
                  max={180}
                  step={5}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-emerald-400 w-20 text-right">
                  {movementMinutes}m
                </span>
              </div>
            </div>
          </div>
        );
        
      case 2: // Stress
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Stress level today
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setStressLevel(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      stressLevel === value
                        ? "bg-purple-500/20 border-purple-500 text-purple-400"
                        : "border-muted-foreground/20 text-muted-foreground hover:border-purple-500/50"
                    )}
                  >
                    {stressLabels[value - 1]}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Mental load / cognitive demand
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setMentalLoad(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      mentalLoad === value
                        ? "bg-purple-500/20 border-purple-500 text-purple-400"
                        : "border-muted-foreground/20 text-muted-foreground hover:border-purple-500/50"
                    )}
                  >
                    {stressLabels[value - 1]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 3: // Hydration
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                Glasses of water today
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[hydrationGlasses]}
                  onValueChange={(v) => setHydrationGlasses(v[0])}
                  min={0}
                  max={16}
                  step={1}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-cyan-400 w-20 text-right">
                  {hydrationGlasses} 🥛
                </span>
              </div>
              <p className="text-xs text-muted-foreground/50 mt-2">
                Target: {settings?.hydration_goal_glasses || 8} glasses
              </p>
            </div>
            
            {settings?.show_nutrition && (
              <div>
                <Label className="text-sm text-muted-foreground mb-3 block">
                  Meal balance today
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setMealBalance(value)}
                      className={cn(
                        "flex-1 py-3 rounded-lg border transition-all text-sm",
                        mealBalance === value
                          ? "bg-orange-500/20 border-orange-500 text-orange-400"
                          : "border-muted-foreground/20 text-muted-foreground hover:border-orange-500/50"
                      )}
                    >
                      {qualityLabels[value - 1]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 4: // Notes
        return (
          <div className="space-y-4">
            <Label className="text-sm text-muted-foreground block">
              Any thoughts or notes about today?
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling? Any observations about your wellness today..."
              className="min-h-[120px] bg-muted/30"
            />
            <p className="text-xs text-muted-foreground/50">
              This is completely optional and private.
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a1525] border-emerald-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              currentStep === 0 && "bg-blue-500/20",
              currentStep === 1 && "bg-emerald-500/20",
              currentStep === 2 && "bg-purple-500/20",
              currentStep === 3 && "bg-cyan-500/20",
              currentStep === 4 && "bg-amber-500/20"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                currentStep === 0 && "text-blue-400",
                currentStep === 1 && "text-emerald-400",
                currentStep === 2 && "text-purple-400",
                currentStep === 3 && "text-cyan-400",
                currentStep === 4 && "text-amber-400"
              )} />
            </div>
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>
        
        {/* Step indicators */}
        <div className="flex gap-2 mb-4">
          {steps.map((step, i) => (
            <div
              key={step.key}
              className={cn(
                "flex-1 h-1 rounded-full transition-all",
                i <= currentStep ? "bg-emerald-500" : "bg-muted-foreground/20"
              )}
            />
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="py-4"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-muted-foreground/10">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={upsertHealth.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {upsertHealth.isPending ? "Saving..." : "Complete"}
              <Check className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
