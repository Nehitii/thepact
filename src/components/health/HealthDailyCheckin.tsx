import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Moon, Activity, Brain, Droplets, Smile, Zap, ChevronRight, ChevronLeft, Check, Sparkles,
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

const CHAMFER = "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)";

export function HealthDailyCheckin({ open, onOpenChange }: HealthDailyCheckinProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [booting, setBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  
  const { data: todayData } = useTodayHealth(user?.id);
  const { data: settings } = useHealthSettings(user?.id);
  const upsertHealth = useUpsertHealthData(user?.id);
  const updateStreak = useUpdateHealthStreak(user?.id);
  
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

  // Boot sequence on open
  useEffect(() => {
    if (open) {
      setBooting(true);
      setBootProgress(0);
      setCurrentStep(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 8;
        setBootProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => setBooting(false), 200);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [open]);

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
    { key: "sleep", icon: Moon, title: t("health.metrics.sleep"), label: "SLEEP TELEMETRY" },
    { key: "activity", icon: Activity, title: t("health.metrics.activity"), label: "ACTIVITY SCAN" },
    { key: "stress", icon: Brain, title: t("health.metrics.stress"), label: "STRESS ANALYSIS" },
    { key: "hydration", icon: Droplets, title: t("health.metrics.hydration"), label: "HYDRATION LEVEL" },
    { key: "mood", icon: Smile, title: t("health.mood.title"), label: "MOOD TELEMETRY" },
    { key: "energy", icon: Zap, title: t("health.energy.title"), label: "ENERGY CURVE" },
    { key: "notes", icon: Sparkles, title: t("health.checkin.todaysNotes"), label: "SYSTEM NOTES" },
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

  const handleNext = () => { if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

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
      mood_level: moodLevel,
      mood_journal: moodJournal || null,
      energy_morning: energyMorning,
      energy_afternoon: energyAfternoon,
      energy_evening: energyEvening,
      notes: notes || null,
    } as Record<string, unknown>);
    await updateStreak.mutateAsync();
    onOpenChange(false);
    setCurrentStep(0);
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  // Chamfered selection button
  const ChamferedBtn = ({ selected, onClick, children, accentColor = "hud-phosphor" }: { selected: boolean; onClick: () => void; children: React.ReactNode; accentColor?: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-3 transition-all text-sm font-mono",
        selected
          ? `bg-${accentColor}/20 text-${accentColor} border-2 border-${accentColor}`
          : "border border-border text-muted-foreground hover:border-hud-phosphor/50"
      )}
      style={{ clipPath: CHAMFER }}
    >
      {children}
    </button>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block font-mono">{t("health.checkin.howDidYouSleep")}</Label>
              <div className="flex items-center gap-4">
                <Slider value={[sleepHours]} onValueChange={(v) => setSleepHours(v[0])} min={0} max={12} step={0.5} className="flex-1" />
                <span className="text-2xl font-bold text-blue-400 w-16 text-right font-orbitron">{sleepHours}h</span>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block font-mono">{t("health.metrics.sleepQuality")}</Label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(v => (
                  <ChamferedBtn key={v} selected={sleepQuality === v} onClick={() => setSleepQuality(v)} accentColor="blue-400">
                    {qualityLabels[v-1]}
                  </ChamferedBtn>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block font-mono">{t("health.metrics.wakeEnergy")}</Label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(v => (
                  <ChamferedBtn key={v} selected={wakeEnergy === v} onClick={() => setWakeEnergy(v)} accentColor="blue-400">
                    {qualityLabels[v-1]}
                  </ChamferedBtn>
                ))}
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block font-mono">{t("health.metrics.activityLevel")}</Label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(v => (
                  <ChamferedBtn key={v} selected={activityLevel === v} onClick={() => setActivityLevel(v)}>
                    {qualityLabels[v-1]}
                  </ChamferedBtn>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block font-mono">{t("health.metrics.movementMinutes")}</Label>
              <div className="flex items-center gap-4">
                <Slider value={[movementMinutes]} onValueChange={(v) => setMovementMinutes(v[0])} min={0} max={180} step={5} className="flex-1" />
                <span className="text-2xl font-bold text-hud-phosphor w-20 text-right font-orbitron">{movementMinutes}m</span>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block font-mono">{t("health.checkin.stressLevel")}</Label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(v => (
                  <ChamferedBtn key={v} selected={stressLevel === v} onClick={() => setStressLevel(v)} accentColor="hud-amber">
                    {stressLabels[v-1]}
                  </ChamferedBtn>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block font-mono">{t("health.metrics.mentalLoad")}</Label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(v => (
                  <ChamferedBtn key={v} selected={mentalLoad === v} onClick={() => setMentalLoad(v)} accentColor="hud-amber">
                    {stressLabels[v-1]}
                  </ChamferedBtn>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block font-mono">{t("health.checkin.hydrationLevel")}</Label>
              <div className="flex items-center gap-4">
                <Slider value={[hydrationGlasses]} onValueChange={(v) => setHydrationGlasses(v[0])} min={0} max={16} step={1} className="flex-1" />
                <span className="text-2xl font-bold text-cyan-400 w-20 text-right font-orbitron">{hydrationGlasses} 🥛</span>
              </div>
              <p className="text-xs text-muted-foreground/50 mt-2 font-mono">
                {t("health.settings.hydrationGoal")}: {settings?.hydration_goal_glasses || 8} {t("health.settings.glasses")}
              </p>
            </div>
            {settings?.show_nutrition && (
              <div>
                <Label className="text-sm text-muted-foreground mb-3 block font-mono">{t("health.metrics.mealBalance")}</Label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(v => (
                    <ChamferedBtn key={v} selected={mealBalance === v} onClick={() => setMealBalance(v)} accentColor="orange-400">
                      {qualityLabels[v-1]}
                    </ChamferedBtn>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return <HealthMoodSelector value={moodLevel} onChange={setMoodLevel} journal={moodJournal} onJournalChange={setMoodJournal} showJournal={true} />;
      case 5:
        return (
          <div className="space-y-6">
            {[
              { label: t("health.energy.morning"), value: energyMorning, setter: setEnergyMorning },
              { label: t("health.energy.afternoon"), value: energyAfternoon, setter: setEnergyAfternoon },
              { label: t("health.energy.evening"), value: energyEvening, setter: setEnergyEvening },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <Label className="text-sm text-muted-foreground mb-3 block font-mono">{label}</Label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(v => (
                    <ChamferedBtn key={v} selected={value === v} onClick={() => setter(v)} accentColor="hud-amber">
                      {qualityLabels[v-1]}
                    </ChamferedBtn>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <Label className="text-sm text-muted-foreground block font-mono">{t("health.checkin.todaysNotes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("health.checkin.notesPlaceholder")} className="min-h-[120px] bg-muted/30 font-mono" />
            <p className="text-xs text-muted-foreground/50 font-mono">{t("common.optional")}</p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-popover border-hud-phosphor/20">
        <AnimatePresence mode="wait">
          {booting ? (
            <motion.div
              key="boot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <p className="font-mono text-hud-phosphor text-sm uppercase tracking-widest mb-4 animate-pulse">
                Initializing Biometric Scan...
              </p>
              <div className="w-full h-1 bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full bg-hud-phosphor"
                  initial={{ width: "0%" }}
                  animate={{ width: `${bootProgress}%` }}
                  transition={{ duration: 0.05 }}
                  style={{ boxShadow: "0 0 8px hsl(var(--hud-phosphor))" }}
                />
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/50 mt-3 uppercase tracking-wider">
                LOADING SUBSYSTEMS · CALIBRATING SENSORS
              </p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="p-2 bg-hud-phosphor/20" style={{ clipPath: CHAMFER }}>
                    <Icon className="w-5 h-5 text-hud-phosphor" />
                  </div>
                  {currentStepData.title}
                </DialogTitle>
              </DialogHeader>
              
              {/* System boot bar */}
              <div className="flex items-center gap-3 mb-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="text-hud-phosphor">STEP {String(currentStep + 1).padStart(2, "0")}/{String(steps.length).padStart(2, "0")}</span>
                <span className="text-muted-foreground/40">::</span>
                <span>{currentStepData.label}</span>
              </div>

              {/* Step progress bar */}
              <div className="flex gap-1 mb-4">
                {steps.map((_, i) => (
                  <div key={i} className={cn("flex-1 h-[2px] transition-all", i <= currentStep ? "bg-hud-phosphor" : "bg-muted")} />
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="py-4">
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
              
              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0} className="text-muted-foreground font-mono">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t("common.back")}
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button onClick={handleNext} className="bg-hud-phosphor/20 border border-hud-phosphor/40 text-hud-phosphor hover:bg-hud-phosphor/30 font-mono"
                    style={{ clipPath: CHAMFER }}>
                    {t("common.next")}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={upsertHealth.isPending}
                    className="bg-hud-phosphor/20 border border-hud-phosphor/40 text-hud-phosphor hover:bg-hud-phosphor/30 animate-neon-pulse font-mono"
                    style={{ clipPath: CHAMFER }}>
                    {upsertHealth.isPending ? t("common.saving") : t("common.save")}
                    <Check className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
