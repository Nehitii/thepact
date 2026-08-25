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
import { Settings, Ruler, Weight, Droplets, Apple, AlertCircle } from "lucide-react";
import { useHealthSettings, useUpsertHealthSettings } from "@/hooks/useHealth";
import {
  type UniteHydratation,
  CL_PAR_VERRE,
  uniteValide,
  quantiteAffichee,
  verresDepuisAffichage,
  formaterQuantite,
  pasAffiche,
  uniteCourte,
} from "@/lib/hydratation";
import { useTranslation } from "react-i18next";

/* ═══════════════════════════════════════════════════════════════
   LES REGLAGES QUI AGISSENT, ET RIEN D AUTRE

   Ce panneau ecrivait dix cles. Verifiees une par une contre le reste
   du code : DEUX seulement etaient lues.

   Les interrupteurs « afficher les metriques » commandaient les cartes
   de l ancien tableau de bord, parties avec la refonte : on pouvait les
   basculer sans que rien ne bouge. Les objectifs de sommeil et
   d activite alimentaient ces memes cartes. Et la section « Daily
   check-in » proposait de choisir entre aujourd hui et hier alors que
   le releve porte sur la veille depuis la refonte — un choix qui n
   existait plus, offert quand meme.

   Pire : l interrupteur IMC masquait les champs TAILLE ET POIDS tout en
   laissant l IMC affiche sur la page. On pouvait donc perdre l acces
   aux reglages sans rien cacher.

   Il ne reste que ce qui a un effet :
     taille et poids          nourrissent l IMC de la fiche
     objectif d hydratation   affiche dans l etape hydratation du releve
     bloc nutrition           ouvre ou ferme cette etape du releve

   Les colonnes mortes restent en base avec leurs valeurs : c est le
   panneau qui mentait, pas la table.
   ═══════════════════════════════════════════════════════════════ */

interface HealthSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HealthSettingsModal({ open, onOpenChange }: HealthSettingsModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: settings } = useHealthSettings(user?.id);
  const upsertSettings = useUpsertHealthSettings(user?.id);

  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [hydrationGoal, setHydrationGoal] = useState(8);
  const [hydrationUnit, setHydrationUnit] = useState<UniteHydratation>("glasses");
  const [showNutrition, setShowNutrition] = useState(false);

  useEffect(() => {
    if (settings) {
      setHeightCm(settings.height_cm?.toString() || "");
      setWeightKg(settings.weight_kg?.toString() || "");
      setHydrationGoal(settings.hydration_goal_glasses || 8);
      setHydrationUnit(uniteValide(settings.hydration_unit));
      setShowNutrition(settings.show_nutrition);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await upsertSettings.mutateAsync({
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        hydration_goal_glasses: hydrationGoal,
        hydration_unit: hydrationUnit,
        show_nutrition: showNutrition,
      });
      onOpenChange(false);
    } catch {
      // Error handled by mutation onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover border-emerald-500/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t("health.settings.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Taille et poids : ils nourrissent l IMC de la fiche, et
              rien ne les masque plus. */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">{t("health.bmi.title")}</h3>

            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {t("health.disclaimer")}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hlt-taille" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Ruler className="w-3 h-3" /> {t("health.bmi.height")} (cm)
                </Label>
                <Input
                  id="hlt-taille"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="175"
                  className="bg-muted/30 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hlt-poids" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Weight className="w-3 h-3" /> {t("health.bmi.weight")} (kg)
                </Label>
                <Input
                  id="hlt-poids"
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="70"
                  className="bg-muted/30 mt-1"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* EN VERRES OU EN LITRES.

              Le verre est une unite domestique : personne ne remplit
              huit fois le meme, et une bouteille se lit en litres.
              Les deux servent, selon comment on boit.

              Ce choix ne touche QUE l affichage. La base garde des
              verres entiers, donc basculer d une unite a l autre ne
              reecrit pas une seule ligne d historique et se defait
              aussi vite qu on l a fait. */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                {t("health.settings.hydrationUnit", "Compter en")}
              </span>
              <div className="flex rounded-md overflow-hidden border border-border" role="group" aria-label={t("health.settings.hydrationUnit", "Compter en")}>
                {([
                  ["glasses", t("health.settings.glasses", "verres")],
                  ["liters", t("health.settings.liters", "litres")],
                ] as const).map(([id, libelle]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={hydrationUnit === id}
                    onClick={() => setHydrationUnit(id)}
                    className={
                      "px-3 py-1 text-xs transition-colors " +
                      (hydrationUnit === id
                        ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-medium"
                        : "text-muted-foreground hover:bg-muted/60")
                    }
                  >
                    {libelle}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {t("health.settings.hydrationGoal")}
              </span>
              <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                {formaterQuantite(hydrationGoal, hydrationUnit)}{" "}
                {uniteCourte(hydrationUnit, t("health.settings.glasses"))}
              </span>
            </div>
            {/* Le curseur travaille dans l unite affichee : en litres,
                il avance par quarts — un verre — et non par unites
                entieres, qui sauteraient quatre verres a la fois. */}
            <Slider
              value={[quantiteAffichee(hydrationGoal, hydrationUnit)]}
              onValueChange={(v) => setHydrationGoal(verresDepuisAffichage(v[0], hydrationUnit))}
              min={quantiteAffichee(4, hydrationUnit)}
              max={quantiteAffichee(16, hydrationUnit)}
              step={pasAffiche(hydrationUnit)}
              aria-label={t("health.settings.hydrationGoal")}
            />
            {hydrationUnit === "liters" && (
              <p className="text-[11px] text-muted-foreground mt-2">
                {t("health.settings.glassEquals", "1 verre = {{cl}} cl", { cl: CL_PAR_VERRE })}
              </p>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Le bloc nutrition : la seule etape du releve qu on puisse
              ouvrir ou fermer. */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Apple className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm">{t("health.metrics.nutrition")}</span>
            </div>
            <Switch
              checked={showNutrition}
              onCheckedChange={setShowNutrition}
              aria-label={t("health.metrics.nutrition")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={upsertSettings.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {upsertSettings.isPending ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
