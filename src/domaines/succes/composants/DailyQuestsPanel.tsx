import { useState } from "react";
import { useDailyQuests, useClaimQuest } from "@/domaines/succes/hooks/useDailyQuests";
import { useVisibleInterval } from "@/socle/hooks/useVisibleInterval";
import { PREF } from "@/socle/outils/preferencesAffichage";
import { PanneauDesOrdres } from "@/domaines/succes/composants/PanneauDesOrdres";

/**
 * Ordres du jour.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI CLOCHAIT N'ÉTAIT PAS LE DESSIN DES LIGNES.
 *
 * Le sceau hexagonal, l'arête colorée et la piste étaient déjà justes.
 * Mais on ne les voyait jamais : la génération des ordres était cassée
 * (voir useDailyQuests), donc la carte vivait en permanence dans son
 * ÉTAT VIDE — une phrase grise et un bouton « Générer » qui demandait
 * à l'utilisateur de s'écrire lui-même sa journée.
 *
 * Une carte n'a pas à demander la permission d'exister. Les ordres se
 * posent seuls à l'ouverture, le bouton disparaît, et il reste à
 * dessiner ce qu'on voit désormais tous les jours.
 *
 * Le dessin vit dans `PanneauDesOrdres` depuis le 23/09 : ce composant
 * n'en garde que les requêtes, l'heure et le repli.
 * ═══════════════════════════════════════════════════════════════
 */
export function DailyQuestsPanel() {
  const { data: quests = [], isLoading } = useDailyQuests();
  const claim = useClaimQuest();

  /* Une minute suffit : on affiche des heures et des minutes, pas des
     secondes. Et `useVisibleInterval` s'arrête quand l'onglet est
     caché — un compte à rebours pour personne ne sert à rien. */
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useVisibleInterval(() => setMaintenant(Date.now()), 60_000);

  /* LE REPLI EST DÉPLIÉ PAR DÉFAUT, et c'est délibéré : cette carte
     sortait justement d'un repli où elle n'était jamais vue. Seul un
     choix explicite la referme — et ce choix tient. */
  const [replie, setReplie] = useState(() => {
    try {
      return localStorage.getItem(PREF.ORDRES_REPLIES) === "1";
    } catch {
      return false; /* navigation privée, quota, politique */
    }
  });

  const basculerRepli = () =>
    setReplie((v) => {
      const suivant = !v;
      try {
        localStorage.setItem(PREF.ORDRES_REPLIES, suivant ? "1" : "0");
      } catch {
        /* le pli tiendra le temps de la session, pas plus */
      }
      return suivant;
    });

  return (
    <PanneauDesOrdres
      quests={quests}
      isLoading={isLoading}
      onReclamer={(id) => claim.mutate(id)}
      reclamationEnCours={claim.isPending}
      maintenant={maintenant}
      replie={replie}
      onBasculerRepli={basculerRepli}
    />
  );
}
