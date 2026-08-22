import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { DSPageShell, DSBackground, DSPageLoader } from "@/components/ds";
import { useHealthSettings, useHealthHistory } from "@/hooks/useHealth";
import { useHealthReminders } from "@/hooks/useHealthReminders";
import { joursARelever, FENETRE_RATTRAPAGE } from "@/lib/health/journee";
import { EnTeteDossier } from "@/components/health/EnTeteDossier";
import { Corps } from "@/components/health/Corps";
import { JournalDuCorps } from "@/components/health/JournalDuCorps";
import { Respiration } from "@/components/health/Respiration";
import { HealthDailyCheckin } from "@/components/health/HealthDailyCheckin";
import { HealthSettingsModal } from "@/components/health/HealthSettingsModal";
import "@/styles/health.css";

/**
 * SANTE — LE DOSSIER.
 *
 * La page etait un tableau de bord : trois onglets, douze panneaux,
 * cinq cartes de metrique, deux graphes, des defis et des analyses
 * automatiques. On y arrivait sans savoir quoi regarder.
 *
 * Elle est devenue trois blocs — puis ces trois blocs portaient encore
 * l en-tete partage par les onze autres pages : deux anneaux qui
 * tournent, un point qui pulse, SANTE en quarante pixels au centre.
 * Deux cent cinquante pixels pour repeter ce que la barre laterale
 * surligne deja, dans une autre langue graphique que la page.
 *
 * Ce n est plus une page, c est UN DOSSIER qu on ouvre a son nom :
 *
 *   LA BANDE      a qui il appartient, sa date, et — seule chose qui
 *                 vaille d etre lue en haut — ce qui y manque
 *   LA FICHE      poids, taille, IMC. Ce qui ne bouge pas d un jour a
 *                 l autre n a rien a faire dans le flux : colonne de
 *                 gauche, figee au defilement
 *   LE JOURNAL    la quinzaine entiere, datee, relevee ou vide. La
 *                 veille garde sa carte : c est le seul appel a
 *                 l action de la page
 *   LE PROTOCOLE  respirer, en pied, deplie des qu on commence
 *
 * CE QUI EST PARTI, ET OU. Les graphes — semaine, courbe d energie,
 * historique — rejoignent Analytics, ou vivent deja tous les autres
 * graphes de l app. Les defis hebdomadaires et les analyses
 * automatiques sont retires.
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
  /* L historique est trie du plus recent au plus ancien. */
  const dernierReleve = historique[0] ?? null;
  const enAttente = joursARelever(datesRelevees).length;

  return (
    <DSPageShell width="lg" background={<DSBackground variant="cyber" />}>
      <div className="hlt">
        <EnTeteDossier enAttente={enAttente} onReglages={() => setReglagesOuverts(true)} />

        <div className="hlt-dossier">
          <Corps
            tailleCm={settings?.height_cm}
            poidsKg={settings?.weight_kg}
            onRegler={() => setReglagesOuverts(true)}
          />

          <JournalDuCorps
            datesRelevees={datesRelevees}
            onOuvrir={(d) => setJourneeOuverte(d)}
          />
        </div>

        {/* Le dernier releve nourrit la suggestion de rythme : tendu
            hier, on propose d apaiser ; le soir, de dormir. */}
        <Respiration
          stress={dernierReleve?.stress_level}
          chargeMentale={dernierReleve?.mental_load}
        />

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
