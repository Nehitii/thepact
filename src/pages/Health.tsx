import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Settings as SettingsIcon } from "lucide-react";
import { DSPageShell, DSBackground, DSPageLoader, DSPageHeader } from "@/components/ds";
import { useHealthSettings, useHealthHistory } from "@/hooks/useHealth";
import { useHealthReminders } from "@/hooks/useHealthReminders";
import { cleDuJour, laVeille, FENETRE_RATTRAPAGE } from "@/lib/health/journee";
import { Corps } from "@/components/health/Corps";
import { ReleveDuJour } from "@/components/health/ReleveDuJour";
import { Respiration } from "@/components/health/Respiration";
import { HealthDailyCheckin } from "@/components/health/HealthDailyCheckin";
import { HealthSettingsModal } from "@/components/health/HealthSettingsModal";
import "@/styles/health.css";

/**
 * SANTE.
 *
 * La page etait un tableau de bord : trois onglets, douze panneaux,
 * cinq cartes de metrique, deux graphes, des defis et des analyses
 * automatiques. On y arrivait sans savoir quoi regarder, et l on en
 * repartait sans avoir rien fait.
 *
 * Elle ne repond plus qu a trois questions, dans cet ordre :
 *
 *   OU J EN SUIS        le corps, en trois chiffres — et l IMC arrondi
 *                       au dixieme, la ou il en affichait quinze.
 *   QU AI-JE A RELEVER  la veille, parce qu une journee close se
 *                       raconte quand une journee qui commence se
 *                       devine. Et les jours manques, qui attendent.
 *   QUE PUIS-JE FAIRE   respirer, tout de suite, sans ouvrir une
 *                       fenetre.
 *
 * CE QUI EST PARTI, ET OU.
 *
 * Les graphes — semaine, courbe d energie, historique — rejoignent
 * Analytics, ou vivent deja tous les autres graphes de l app : ils y
 * sont a leur place, et ici ils encombraient. Les defis hebdomadaires
 * et les analyses automatiques sont retires.
 */
export default function Health() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  /* La date du releve ouvert : la veille par defaut, ou l un des jours
     manques qu on rattrape. Null quand la fenetre est fermee. */
  const [journeeOuverte, setJourneeOuverte] = useState<string | null>(null);

  const { data: settings, isLoading } = useHealthSettings(user?.id);
  /* Un jour de plus que la fenetre de rattrapage : il faut voir la
     veille ET les quatorze jours qui la precedent. */
  const { data: historique = [] } = useHealthHistory(user?.id, FENETRE_RATTRAPAGE + 1);

  useHealthReminders();

  if (isLoading) return <DSPageLoader variant="verbose" message={t("health.loading")} />;

  const datesRelevees = historique.map((h) => h.entry_date);

  return (
    <DSPageShell width="lg" background={<DSBackground variant="cyber" />}>
      <DSPageHeader
        variant="hud"
        systemLabel={`HLT.SYS // ${cleDuJour(laVeille()).replace(/-/g, ".")}`}
        title="SAN"
        titleAccent="TÉ"
        actions={
          <button
            onClick={() => setReglagesOuverts(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/60 transition-colors"
            title={t("common.settings")}
            aria-label={t("common.settings")}
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        }
      />

      <div className="hlt">
        <Corps
          tailleCm={settings?.height_cm}
          poidsKg={settings?.weight_kg}
          onRegler={() => setReglagesOuverts(true)}
        />

        <ReleveDuJour
          datesRelevees={datesRelevees}
          onOuvrir={(d) => setJourneeOuverte(d)}
        />

        <Respiration />

        <p className="hlt-note">{t("health.disclaimer")}</p>
      </div>

      <HealthSettingsModal open={reglagesOuverts} onOpenChange={setReglagesOuverts} />

      {/* La fenetre est montee sur la date choisie : la remonter a
          chaque ouverture garantit qu elle recharge le bon jour. */}
      {journeeOuverte && (
        <HealthDailyCheckin
          key={journeeOuverte}
          open
          date={journeeOuverte}
          onOpenChange={(o) => { if (!o) setJourneeOuverte(null); }}
        />
      )}
    </DSPageShell>
  );
}
