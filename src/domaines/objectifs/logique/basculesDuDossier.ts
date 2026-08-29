/* CE QU UNE BASCULE CHANGE — calcule une fois, pour l ecran comme
 * pour la base.
 *
 * Chaque bascule du dossier s ecrivait DEUX FOIS : une fois dans
 * mutationFn, qui ecrit en base, et une fois dans onMutate, qui
 * repeint l ecran sans attendre. Deux copies du meme calcul, l une
 * pour ce qu on montre et l autre pour ce qu on garde.
 *
 * Elles n avaient aucun moyen de rester d accord, et pour la bascule
 * d etape elles ne le sont deja plus : voir compteDesEtapesTenues.
 */

/** Cocher decoche, decocher coche. */
export function basculeDUneEtape(statutActuel: string): "completed" | "pending" {
  return statutActuel === "completed" ? "pending" : "completed";
}

interface EtapePourCompte {
  id: string;
  status?: string | null;
  is_ultimate?: boolean | null;
}

/* L ETAPE ULTIME NE COMPTE PAS DANS L AVANCEMENT — y compris quand
   c est elle qu on vient de cocher : elle ouvre le zenith, elle ne
   fait pas avancer l objectif. C est aussi ce que fait total_steps a
   l enregistrement, qui exclut l etape ultime : les deux colonnes se
   lisent donc dans la meme unite. */
export function compteDesEtapesTenues(
  etapes: EtapePourCompte[],
  etapeBasculee: string,
  nouveauStatut: string,
): number {
  return etapes
    .filter((e) => !e.is_ultimate)
    .filter((e) => (e.id === etapeBasculee ? nouveauStatut : e.status) === "completed").length;
}

export interface EtatDeLHabitude {
  coches: boolean[];
  tenus: number;
  acheve: boolean;
  statut: "fully_completed" | "in_progress" | "not_started";
}

/* UNE HABITUDE N A PAS D ETAPES : ses jours coches en tiennent lieu,
   et son statut se deduit entierement de leur nombre. Ce bloc etait
   recopie mot pour mot dans les deux moities de la bascule. */
export function etatDeLHabitude(
  cochesActuelles: boolean[],
  jour: number,
  coche: boolean,
  duree: number | null | undefined,
): EtatDeLHabitude {
  const coches = [...cochesActuelles];
  coches[jour] = coche;
  const tenus = coches.filter(Boolean).length;
  /* L egalite stricte, et non « au moins » : une duree raccourcie
     apres coup laisse l habitude en cours plutot que de l honorer sur
     un total qui n a jamais ete celui promis. */
  const acheve = tenus === duree;
  return {
    coches,
    tenus,
    acheve,
    statut: acheve ? "fully_completed" : tenus > 0 ? "in_progress" : "not_started",
  };
}
