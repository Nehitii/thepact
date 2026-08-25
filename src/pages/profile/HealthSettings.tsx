import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Heart, Ruler, Weight, Droplets, Apple } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthSettings, useUpsertHealthSettings } from "@/hooks/useHealth";
import { ConsoleReglages } from "@/components/profile/ConsoleReglages";
import { Panneau, Reglage, Segmente, Jauge, ChampTexte, Alerte, Bouton } from "@/components/profile/console-ui";
import {
  type UniteHydratation, CL_PAR_VERRE, uniteValide, quantiteAffichee,
  verresDepuisAffichage, formaterQuantite, pasAffiche, uniteCourte,
} from "@/lib/hydratation";

/* ═══════════════════════════════════════════════════════════════
   LE MODULE SANTÉ REJOINT LA CONSOLE

   Ses réglages vivaient derrière un bouton « RÉGLER » de la page
   Santé, dans une fenêtre à part. Une quatrième surface de réglages,
   après la console, le modal finance et les préférences par page.

   J'avais écrit qu'aucune option ne méritait un dixième onglet. Cette
   phrase visait UNE option isolée. Un module entier avec cinq
   réglages, c'est autre chose : Confidentialité en a trois, et
   personne ne lui conteste sa place dans le rail.

   La page Santé garde ce qu'on y fait — relever, lire, comparer. Ce
   qu'on y règle une fois pour toutes est ici, avec tout le reste.
   ═══════════════════════════════════════════════════════════════ */

export default function HealthSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: settings } = useHealthSettings(user?.id);
  const enregistrer = useUpsertHealthSettings(user?.id);

  const [taille, setTaille] = useState("");
  const [poids, setPoids] = useState("");
  const [objectif, setObjectif] = useState(8);
  const [unite, setUnite] = useState<UniteHydratation>("glasses");
  const [nutrition, setNutrition] = useState(false);
  /* La derniere ecriture, en pied du panneau concerne — la convention
     de la console : dire CE QUI a change, pas qu on a change. */
  const [journal, setJournal] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!settings) return;
    setTaille(settings.height_cm?.toString() ?? "");
    setPoids(settings.weight_kg?.toString() ?? "");
    setObjectif(settings.hydration_goal_glasses || 8);
    setUnite(uniteValide(settings.hydration_unit));
    setNutrition(settings.show_nutrition);
  }, [settings]);

  /* CE QUI SE VALIDE AU RELÂCHEMENT S'ÉCRIT TOUT DE SUITE.
     Un interrupteur, une glissière, un segmenté disent quand ils ont
     fini. Un champ de texte, non : lui seul mérite un bouton, comme
     partout ailleurs dans la console. */
  const poser = (
    champ: Parameters<typeof enregistrer.mutateAsync>[0],
    panneau: string,
    dit: string,
  ) => enregistrer.mutate(champ, { onSuccess: () => setJournal((j) => ({ ...j, [panneau]: dit })) });

  const corpsModifie =
    (settings?.height_cm?.toString() ?? "") !== taille ||
    (settings?.weight_kg?.toString() ?? "") !== poids;

  const motVerres = t("health.settings.glasses");

  return (
    <ConsoleReglages
      titre={t("settings.health.title", "Santé")}
      note={t("settings.health.note", "Ce que le relevé quotidien te demande, et ce qu’il en fait.")}
    >
      {/* ── LE CORPS ── */}
      <Panneau
        code={t("health.bmi.title")}
        etat={taille && poids ? t("settings.console.ready", "renseigné") : t("common.optional")}
        ton={taille && poids ? "actif" : "neutre"}
        journal={journal.corps ? { texte: journal.corps, type: "ok" } : null}
      >
        <div className="space-y-4 py-2">
          <Alerte ton="info">{t("health.disclaimer")}</Alerte>

          <div className="grid grid-cols-2 gap-3">
            <ChampTexte
              etiquette={<><Ruler aria-hidden="true" /> {t("health.bmi.height")} (cm)</>}
              type="number"
              inputMode="decimal"
              value={taille}
              placeholder="175"
              onChange={(e) => setTaille(e.target.value)}
            />
            <ChampTexte
              etiquette={<><Weight aria-hidden="true" /> {t("health.bmi.weight")} (kg)</>}
              type="number"
              inputMode="decimal"
              value={poids}
              placeholder="70"
              onChange={(e) => setPoids(e.target.value)}
            />
          </div>

          <Bouton
            role="primaire"
            disabled={!corpsModifie || enregistrer.isPending}
            onClick={() =>
              poser(
                {
                  height_cm: taille ? parseFloat(taille) : null,
                  weight_kg: poids ? parseFloat(poids) : null,
                },
                "corps",
                `${taille || "—"} cm · ${poids || "—"} kg`,
              )
            }
          >
            {enregistrer.isPending
              ? t("common.saving", "Enregistrement…")
              : t("settings.health.saveBody", "Enregistrer taille et poids")}
          </Bouton>
        </div>
      </Panneau>

      {/* ── L HYDRATATION ── */}
      <Panneau
        code={t("health.settings.hydrationGoal")}
        etat={`${formaterQuantite(objectif, unite)} ${uniteCourte(unite, motVerres)}`}
        journal={journal.eau ? { texte: journal.eau, type: "ok" } : null}
      >
        <Reglage
          nom={t("health.settings.hydrationUnit", "Compter en")}
          note={unite === "liters"
            ? t("health.settings.glassEquals", "1 verre = {{cl}} cl", { cl: CL_PAR_VERRE })
            : t("settings.health.unitNote", "Le stockage ne bouge pas : la bascule se défait à tout instant.")}
          icone={<Droplets aria-hidden="true" />}
          large
        >
          <Segmente<UniteHydratation>
            valeur={unite}
            onChange={(v) => {
              setUnite(v);
              poser({ hydration_unit: v }, "eau", `unité → ${v === "liters" ? "litres" : motVerres}`);
            }}
            aria={t("health.settings.hydrationUnit", "Compter en")}
            options={[
              { valeur: "glasses", libelle: motVerres },
              { valeur: "liters", libelle: t("health.settings.liters", "litres") },
            ]}
          />
        </Reglage>

        <Reglage
          nom={t("health.settings.hydrationGoal")}
          note={t("settings.health.goalNote", "Rappelé sous le curseur du relevé.")}
          icone={<Heart aria-hidden="true" />}
          large
        >
          <Jauge valeur={`${formaterQuantite(objectif, unite)} ${uniteCourte(unite, motVerres)}`}>
            <Slider
              value={[quantiteAffichee(objectif, unite)]}
              onValueChange={(v) => setObjectif(verresDepuisAffichage(v[0], unite))}
              onValueCommit={(v) => {
                const verres = verresDepuisAffichage(v[0], unite);
                poser(
                  { hydration_goal_glasses: verres },
                  "eau",
                  `objectif → ${formaterQuantite(verres, unite)} ${uniteCourte(unite, motVerres)}`,
                );
              }}
              min={quantiteAffichee(4, unite)}
              max={quantiteAffichee(16, unite)}
              step={pasAffiche(unite)}
            />
          </Jauge>
        </Reglage>
      </Panneau>

      {/* ── LES ÉTAPES DU RELEVÉ ── */}
      <Panneau
        code={t("settings.health.checkin", "Le relevé")}
        etat={nutrition ? t("settings.health.stepsOn", "7 étapes") : t("settings.health.stepsOff", "6 étapes")}
        journal={journal.releve ? { texte: journal.releve, type: "ok" } : null}
      >
        <Reglage
          nom={t("health.metrics.nutrition")}
          note={t("settings.health.nutritionNote", "Ajoute une étape au relevé quotidien.")}
          icone={<Apple aria-hidden="true" />}
        >
          <Switch
            checked={nutrition}
            onCheckedChange={(v) => {
              setNutrition(v);
              poser({ show_nutrition: v }, "releve", `nutrition → ${v ? "affichée" : "masquée"}`);
            }}
          />
        </Reglage>
      </Panneau>
    </ConsoleReglages>
  );
}
