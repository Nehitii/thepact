import { useState, useEffect } from "react";
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
  Smile,
  Zap,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodayHealth, useUpsertHealthData, useHealthSettings } from "@/hooks/useHealth";
import { useUpdateHealthStreak } from "@/hooks/useHealthStreak";
import { HealthMoodSelector } from "./HealthMoodSelector";
import { useTranslation } from "react-i18next";

interface HealthDailyCheckinProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HealthDailyCheckin({ open, onOpenChange }: HealthDailyCheckinProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  
  const { data: todayData } = useTodayHealth(user?.id);
  const { data: settings } = useHealthSettings(user?.id);
  const upsertHealth = useUpsertHealthData(user?.id);
  const updateStreak = useUpdateHealthStreak(user?.id);
  
  // Form state
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [wakeEnergy, setWakeEnergy] = useState<number>(3);
  const [activityLevel, setActivityLevel] = useState<number>(3);
  const [movementMinutes, setMovementMinutes] = useState<number>(30);
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [mentalLoad, setMentalLoad] = useState<number>(3);
  const [hydrationGlasses, setHydrationGlasses] = useState<number>(4);
  const [mealBalance, setMealBalance] = useState<number>(3);
  const [moodLevel, setMoodLevel] = useState<number>(3);
  const [moodJournal, setMoodJournal] = useState<string>("");
  const [energyMorning, setEnergyMorning] = useState<number>(3);
  const [energyAfternoon, setEnergyAfternoon] = useState<number>(3);
  const [energyEvening, setEnergyEvening] = useState<number>(3);
  const [notes, setNotes] = useState<string>("");

  // Sync form state when todayData loads
  useEffect(() => {
    if (todayData) {
      setSleepHours(todayData.sleep_hours ?? 7);
      setSleepQuality(todayData.sleep_quality ?? 3);
      setWakeEnergy(todayData.wake_energy ?? 3);
      setActivityLevel(todayData.activity_level ?? 3);
      setMovementMinutes(todayData.movement_minutes ?? 30);
      setStressLevel(todayData.stress_level ?? 3);
      setMentalLoad(todayData.mental_load ?? 3);
      setHydrationGlasses(todayData.hydration_glasses ?? 4);
      setMealBalance(todayData.meal_balance ?? 3);
      // Handle extended fields
      const extData = todayData as unknown as { mood_level?: number; mood_journal?: string; energy_morning?: number; energy_afternoon?: number; energy_evening?: number };
      setMoodLevel(extData.mood_level ?? 3);
      setMoodJournal(extData.mood_journal ?? "");
      setEnergyMorning(extData.energy_morning ?? 3);
      setEnergyAfternoon(extData.energy_afternoon ?? 3);
      setEnergyEvening(extData.energy_evening ?? 3);
      setNotes(todayData.notes ?? "");
    }
  }, [todayData]);

  const steps = [
    { key: "sleep", icon: Moon, title: t("health.metrics.sleep"), color: "blue" },
    { key: "activity", icon: Activity, title: t("health.metrics.activity"), color: "green" },
    { key: "stress", icon: Brain, title: t("health.metrics.stress"), color: "purple" },
    { key: "hydration", icon: Droplets, title: t("health.metrics.hydration"), color: "cyan" },
    { key: "mood", icon: Smile, title: t("health.mood.title"), color: "amber" },
    { key: "energy", icon: Zap, title: t("health.energy.title"), color: "yellow" },
    { key: "notes", icon: Sparkles, title: t("health.checkin.todaysNotes"), color: "pink" },
  ];

  const qualityLabels = [
    t("health.checkin.quality.poor", "Poor"),
    t("health.checkin.quality.fair", "Fair"),
    t("health.checkin.quality.okay", "Okay"),
    t("health.checkin.quality.good", "Good"),
    t("health.checkin.quality.great", "Great"),
  ];
  
  const stressLabels = [
    t("health.checkin.stress.minimal", "Minimal"),
    t("health.checkin.stress.low", "Low"),
    t("health.checkin.stress.moderate", "Moderate"),
    t("health.checkin.stress.high", "High"),
    t("health.checkin.stress.overwhelming", "Overwhelming"),
  ];

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
      // Pass mood fields through extended input
    } as Record<string, unknown>);
    
    // Update streak after successful check-in
    await updateStreak.mutateAsync();
    
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
                {t("health.checkin.howDidYouSleep")}
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
                {t("health.metrics.sleepQuality")}
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSleepQuality(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      sleepQuality === value
                        ? "bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-border text-muted-foreground hover:border-blue-500/50"
                    )}
                  >
                    {qualityLabels[value - 1]}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                {t("health.metrics.wakeEnergy")}
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setWakeEnergy(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      wakeEnergy === value
                        ? "bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-border text-muted-foreground hover:border-blue-500/50"
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
                {t("health.metrics.activityLevel")}
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setActivityLevel(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      activityLevel === value
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        : "border-border text-muted-foreground hover:border-emerald-500/50"
                    )}
                  >
                    {qualityLabels[value - 1]}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                {t("health.metrics.movementMinutes")}
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
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 w-20 text-right">
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
                {t("health.checkin.stressLevel")}
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setStressLevel(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      stressLevel === value
                        ? "bg-purple-500/20 border-purple-500 text-purple-600 dark:text-purple-400"
                        : "border-border text-muted-foreground hover:border-purple-500/50"
                    )}
                  >
                    {stressLabels[value - 1]}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">
                {t("health.metrics.mentalLoad")}
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setMentalLoad(value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all text-sm",
                      mentalLoad === value
                        ? "bg-purple-500/20 border-purple-500 text-purple-600 dark:text-purple-400"
                        : "border-border text-muted-foreground hover:border-purple-500/50"
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
                {t("health.checkin.hydrationLevel")}
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
                <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 w-20 text-right">
                  {hydrationGlasses} 🥛
                </span>
              </div>
              <p className="text-xs text-muted-foreground/50 mt-2">
                {t("health.settings.hydrationGoal")}: {settings?.hydration_goal_glasses || 8} {t("health.settings.glasses")}
              </p>
            </div>
            
            {settings?.show_nutrition && (
              <div>
                <Label className="text-sm text-muted-foreground mb-3 block">
                  {t("health.metrics.mealBalance")}
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setMealBalance(value)}
                      className={cn(
                        "flex-1 py-3 rounded-lg border transition-all text-sm",
                        mealBalance === value
                          ? "bg-orange-500/20 border-orange-500 text-orange-600 dark:text-orange-400"
                          : "border-border text-muted-foreground hover:border-orange-500/50"
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
        
      case 4: // Mood
        return (
          <HealthMoodSelector
            value={moodLevel}
            onChange={setMoodLevel}
            journal={moodJournal}
            onJournalChange={setMoodJournal}
            showJournal={true}
          />
        );
        
      case 5: // Energy
        return (
          <div className="space-y-6">
            {[
              { label: t("health.energy.morning"), value: energyMorning, setter: setEnergyMorning },
              { label: t("health.energy.afternoon"), value: energyAfternoon, setter: setEnergyAfternoon },
              { label: t("health.energy.evening"), value: energyEvening, setter: setEnergyEvening },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <Label className="text-sm text-muted-foreground mb-3 block">{label}</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setter(v)}
                      className={cn(
                        "flex-1 py-3 rounded-lg border transition-all text-sm",
                        value === v
                          ? "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400"
                          : "border-border text-muted-foreground hover:border-amber-500/50"
                      )}
                    >
                      {qualityLabels[v - 1]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 6: // Notes
        return (
          <div className="space-y-4">
            <Label className="text-sm text-muted-foreground block">
              {t("health.checkin.todaysNotes")}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("health.checkin.notesPlaceholder")}
              className="min-h-[120px] bg-muted/30"
            />
            <p className="text-xs text-muted-foreground/50">
              {t("common.optional")}
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-popover border-emerald-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              currentStep === 0 && "bg-blue-500/20",
              currentStep === 1 && "bg-emerald-500/20",
              currentStep === 2 && "bg-purple-500/20",
              currentStep === 3 && "bg-cyan-500/20",
              currentStep === 4 && "bg-amber-500/20",
              currentStep === 5 && "bg-pink-500/20"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                currentStep === 0 && "text-blue-600 dark:text-blue-400",
                currentStep === 1 && "text-emerald-600 dark:text-emerald-400",
                currentStep === 2 && "text-purple-600 dark:text-purple-400",
                currentStep === 3 && "text-cyan-600 dark:text-cyan-400",
                currentStep === 4 && "text-amber-600 dark:text-amber-400",
                currentStep === 5 && "text-pink-600 dark:text-pink-400"
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
                i <= currentStep ? "bg-emerald-500" : "bg-muted"
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
        <div className="flex justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t("common.back")}
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {t("common.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={upsertHealth.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {upsertHealth.isPending ? t("common.saving") : t("common.save")}
              <Check className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}