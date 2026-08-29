import type { SuperGoalRule } from "@/domaines/objectifs/types";

/* LE GARDE-FOU DES MODIFICATIONS NON ENREGISTREES.
 *
 * Il compare deux photographies du formulaire : celle prise a
 * l ouverture, et celle de maintenant. Si elles different, fermer
 * demande confirmation.
 *
 * LA FORME ETAIT ECRITE DEUX FOIS — une fois pour la photographie
 * initiale, une fois pour la comparaison — avec ses treize champs
 * recopies a l identique. Ajouter un champ a l une sans l autre ne
 * casse rien : le garde-fou cesse simplement de remarquer ce
 * champ-la, en silence, et on perd une saisie sans jamais avoir ete
 * prevenu.
 *
 * Une seule fonction, deux appelants. C est la seule facon qu elles ne
 * puissent plus diverger.
 */
export interface ChampsDeLAtelier {
  editName: string;
  editDifficulty: string;
  editTags: string[];
  editNotes: string;
  editStartDate: string;
  editCompletionDate: string;
  editImage: string;
  editStepItems: { dbId?: string; name: string }[];
  editCostItems: unknown[];
  editMembresIds: string[];
  editRegle: SuperGoalRule;
  editVivant: boolean;
  editDuree: number;
}

export function empreinteDeLAtelier(c: ChampsDeLAtelier): string {
  return JSON.stringify({
    editName: c.editName,
    editDifficulty: c.editDifficulty,
    editTags: c.editTags,
    editNotes: c.editNotes,
    editStartDate: c.editStartDate,
    editCompletionDate: c.editCompletionDate,
    editImage: c.editImage,
    /* D UNE ETAPE, ON NE RETIENT QUE SON IDENTITE ET SON NOM. Le reste
       — son rang, son etat, ses champs calcules — bouge sans que
       l utilisateur ait rien tape, et demanderait confirmation pour
       une modification qu il n a pas faite. */
    editStepItems: c.editStepItems.map((s) => ({ dbId: s.dbId, name: s.name })),
    editCostItems: c.editCostItems,
    editMembresIds: c.editMembresIds,
    editRegle: c.editRegle,
    editVivant: c.editVivant,
    editDuree: c.editDuree,
  });
}

/** Y a-t-il quelque chose a perdre en fermant ? */
export function quelqueChoseAPerdre(initiale: string | null, maintenant: string): boolean {
  /* PAS D EMPREINTE INITIALE, PAS DE GARDE-FOU. Le dialogue n a jamais
     ete ouvert : il n y a rien a comparer, et demander confirmation
     serait absurde. */
  if (!initiale) return false;
  return maintenant !== initiale;
}
