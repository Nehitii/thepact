import { useClaimQuest, useDailyQuests } from "@/domaines/succes";
import { useRepliDesOrdres } from "@/domaines/accueil/hooks/useRepliDesOrdres";
import { PointeuseNuit } from "@/domaines/accueil/composants/ordres/pointeuse/PointeuseNuit";

/* LES ORDRES DU JOUR DE L ACCUEIL — L ATELIER DE NUIT, depuis le 23/09.
 *
 * Le dessin est celui qu on a choisi au banc des ordres (B4). Ce
 * composant n y ajoute que le vrai : les ordres et leur reclamation,
 * lus par la porte du domaine succes, et le repli qui dure.
 *
 * L ORDRE EN COURS DE RECLAMATION est celui que la mutation porte tant
 * qu elle n a pas repondu : son bouton attend, les autres restent
 * actifs. Le toast de la prime, et celui d une erreur, restent ceux de
 * `useClaimQuest`. */
export function OrdresDuJour() {
  const { data: ordres = [], isLoading } = useDailyQuests();
  const reclamation = useClaimQuest();
  const { replie, basculer } = useRepliDesOrdres();

  return (
    <PointeuseNuit
      ordres={ordres}
      chargement={isLoading}
      onReclamer={(id) => reclamation.mutate(id)}
      enReclamation={reclamation.isPending ? (reclamation.variables ?? null) : null}
      replie={replie}
      onBasculerRepli={basculer}
    />
  );
}
