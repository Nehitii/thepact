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
import { useTodayHealth, useUpsertHealthData, useHealthSettings, useHealthByDate } from "@/hooks/useHealth";
import { format, subDays, parseISO } from "date-fns";
import { HealthMoodSelector } from "./HealthMoodSelector";
import { useTranslation } from "react-i18next";

interface HealthDailyCheckinProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /* LA JOURNEE QU ON RACONTE, ET NON CELLE OU L ON SE TROUVE.
     Le releve portait sur AUJOURD HUI, derriere un reglage qui valait
     « today » par defaut : on le remplissait donc le matin, en notant
     un sommeil qu on venait de finir a cote d une activite qui n avait
     pas eu lieu. La moitie des champs etaient des suppositions.
     La date vient maintenant d en haut : la veille par defaut, ou l un
     des jours manques qu on rattrape. */
  date?: string;
}

const CHAMFER = "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)";

export function HealthDailyCheckin({ open, onOpenChange, date }: HealthDailyCheckinProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  
  const { data: settings } = useHealthSettings(user?.id);
  const targetDate = date ?? format(subDays(new Date(), 1), "yyyy-MM-dd");
  const estLaVeille = targetDate === format(subDays(new Date(), 1), "yyyy-MM-dd");
  const targetDateLabel = estLaVeille ? t("health.checkin.yesterday", "Hier") : format(parseISO(targetDate), "dd.MM");
  
  const { data: todayData } = useHealthByDate(user?.id, targetDate);
  const upsertHealth = useUpsertHealthData(user?.id);
  
  /* AUCUNE VALEUR PAR DEFAUT, ET C EST LE POINT.
     Chaque champ s ouvrait pre-rempli d une mesure inventee — sommeil a
     sept heures, tout le reste a trois, hydratation a quatre verres,
     mouvement a trente minutes. Enchainer les sept etapes sans rien
     toucher inscrivait quinze mesures imaginaires comme si elles
     avaient ete constatees, et c est exactement ce qui arrive quand on
     rattrape treize jours a la chaine.
     Toute la refonte tenait sur une phrase : une journee finie SE
     RACONTE, elle ne se devine pas. Un champ qu on n a pas touche reste
     donc nul, et la colonne l accepte. */
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [wakeEnergy, setWakeEnergy] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<number | null>(null);
  const [movementMinutes, setMovementMinutes] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [mentalLoad, setMentalLoad] = useState<number | null>(null);
  const [hydrationGlasses, setHydrationGlasses] = useState<number | null>(null);
  const [mealBalance, setMealBalance] = useState<number | null>(null);
  const [moodLevel, setMoodLevel] = useState<number | null>(null);
  const [moodJournal, setMoodJournal] = useState<string>("");
  const [energyMorning, setEnergyMorning] = useState<number | null>(null);
  const [energyAfternoon, setEnergyAfternoon] = useState<number | null>(null);
  const [energyEvening, setEnergyEvening] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");

  /* LA FENETRE S OUVRE SUR LA PREMIERE ETAPE, ET C EST TOUT.
     Une sequence de demarrage factice tenait l ecran 850 ms avant
     chaque ouverture — treize increments de 50 ms puis 200 ms
     d attente — pour afficher « Initializing Biometric Scan ».
     Rattraper treize jours, c etait onze secondes de theatre. */
  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  useEffect(() => {
    if (todayData) {
      setSleepHours(todayData.sleep_hours ?? null);
      setSleepQuality(todayData.sleep_quality ?? null);
      setWakeEnergy(todayData.wake_energy ?? null);
      setActivityLevel(todayData.activity_level ?? null);
      setMovementMinutes(todayData.movement_minutes ?? null);
      setStressLevel(todayData.stress_level ?? null);
      setMentalLoad(todayData.mental_load ?? null);
      setHydrationGlasses(todayData.hydration_glasses ?? null);
      setMealBalance(todayData.meal_balance ?? null);
      const extData = todayData as unknown as { mood_level?: number; mood_journal?: string; energy_morning?: number; energy_afternoon?: number; energy_evening?: number };
      setMoodLevel(extData.mood_level ?? null);
      setMoodJournal(extData.mood_journal ?? "");
      setEnergyMorning(extData.energy_morning ?? null);
      setEnergyAfternoon(extData.energy_afternoon ?? null);
      setEnergyEvening(extData.energy_evening ?? null);
      setNotes(todayData.notes ?? "");
    }
  }, [todayData]);

  const steps = [
    { key: "sleep", icon: Moon, title: t("health.metrics.sleep"), label: t("health.checkin.scan.sleep") },
    { key: "activity", icon: Activity, title: t("health.metrics.activity"), label: t("health.checkin.scan.activity") },
    { key: "stress", icon: Brain, title: t("health.metrics.stress"), label: t("health.checkin.scan.stress") },
    { key: "hydration", icon: Droplets, title: t("health.metrics.hydration"), label: t("health.checkin.scan.hydration") },
    { key: "mood", icon: Smile, title: t("health.mood.title"), label: t("health.checkin.scan.mood") },
    { key: "energy", icon: Zap, title: t("health.energy.title"), label: t("health.checkin.scan.energy") },
    { key: "notes", icon: Sparkles, title: t("health.checkin.todaysNotes"), label: t("health.checkin.scan.notes") },
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
      entry_date: targetDate,
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
    onOpenChange(false);
    setCurrentStep(0);
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  /* LES CLASSES SONT ECRITES EN TOUTES LETTRES, ET C EST OBLIGATOIRE.
     Elles etaient construites par interpolation, et Tailwind — qui lit
     le source sans l executer — ne les a donc jamais generees. Mesure
     faite dans le navigateur sur un bouton selectionne : text-blue-400
     et border-2 s appliquaient bien, parce qu ils existent ailleurs en
     litteral, mais bg-blue-400/20 et border-blue-400 non — fond
     transparent, bordure restee au jeton par defaut. Le bouton n avait
     l air qu a moitie coche, ce qui explique que ca soit passe. */
  const ACCENTS: Record<string, string> = {
    "hud-phosphor": "bg-hud-phosphor/20 text-hud-phosphor border-hud-phosphor",
    "blue-400": "bg-blue-400/20 text-blue-400 border-blue-400",
    "hud-amber": "bg-hud-amber/20 text-hud-amber border-hud-amber",
    "orange-400": "bg-orange-400/20 text-orange-400 border-orange-400",
  };

  // Chamfered selection button
  const ChamferedBtn = ({ selected, onClick, children, accentColor = "hud-phosphor" }: { selected: boolean; onClick: () => void; children: React.ReactNode; accentColor?: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-3 transition-all text-sm font-mono",
        selected
          ? cn("border-2", ACCENTS[accentColor] ?? ACCENTS["hud-phosphor"])
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
                <Slider value={[sleepHours ?? 7]} onValueChange={(v) => setSleepHours(v[0])} min={0} max={12} step={0.5} className="flex-1" />
                <span className="text-2xl font-bold text-blue-400 w-16 text-right font-orbitron">{sleepHours === null ? "—" : `${sleepHours}h`}</span>
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
                <Slider value={[movementMinutes ?? 30]} onValueChange={(v) => setMovementMinutes(v[0])} min={0} max={180} step={5} className="flex-1" />
                <span className="text-2xl font-bold text-hud-phosphor w-20 text-right font-orbitron">{movementMinutes === null ? "—" : `${movementMinutes}m`}</span>
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
                <Slider value={[hydrationGlasses ?? 4]} onValueChange={(v) => setHydrationGlasses(v[0])} min={0} max={16} step={1} className="flex-1" />
                <span className="text-2xl font-bold text-cyan-400 w-20 text-right font-orbitron">{hydrationGlasses === null ? "—" : `${hydrationGlasses} 🥛`}</span>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="p-2 bg-hud-phosphor/20" style={{ clipPath: CHAMFER }}>
                    <Icon className="w-5 h-5 text-hud-phosphor" />
                  </div>
                  {currentStepData.title}
                </DialogTitle>
              </DialogHeader>
              
              {/* System boot bar */}
              <div className="flex items-center gap-3 mb-4 font-mono ds-t-label uppercase tracking-wider text-muted-foreground">
                <span className="text-hud-phosphor">{t("health.checkin.step", "Étape")} {String(currentStep + 1).padStart(2, "0")}/{String(steps.length).padStart(2, "0")}</span>
                <span className="text-muted-foreground/40">::</span>
                <span>{currentStepData.label}</span>
                <span className="text-muted-foreground/40">::</span>
                <span className="text-hud-amber">{targetDateLabel}</span>
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
      </DialogContent>
    </Dialog>
  );
}
