import type { TablesUpdate } from "@/socle/supabase/types";

/* UNE ETIQUETTE N EST PAS UN TYPE, ET LA BASE LE SAIT.
 *
 * `goals.type` est un enum a NEUF valeurs. GOAL_TAGS en propose
 * dix-huit, dont neuf que l enum refuse — arts, tech, travel, work,
 * community, nature, spiritual, lifestyle, buying_selling. Verifie en
 * base : `select 'arts'::goal_type` echoue.
 *
 * Choisir « Arts » en PREMIERE etiquette faisait echouer la creation
 * de l objectif, avec pour seul message « Failed to create goal ».
 * Un `as any` sur l insert rendait ce chemin muet a la compilation ;
 * c est l utilisateur qui le decouvrait.
 *
 * CETTE LISTE ETAIT ECRITE DEUX FOIS — une fois pour la creation, une
 * fois pour la modification, sous deux noms differents et dans deux
 * fichiers. Ajouter une valeur a l enum Postgres en ne corrigeant
 * qu une des deux copies aurait fait accepter le type d un cote et
 * silencieusement ignorer de l autre.
 *
 * Les valeurs viennent de pg_enum, et le « satisfies » les y tient :
 * une valeur inventee ici ne compile pas.
 */
export type TypeObjectif = NonNullable<TablesUpdate<"goals">["type"]>;

export const TYPES_OBJECTIF = [
  "personal", "professional", "health", "creative",
  "financial", "learning", "other", "relationship", "diy",
] as const satisfies readonly TypeObjectif[];

export const estTypeObjectif = (t: string): t is TypeObjectif =>
  (TYPES_OBJECTIF as readonly string[]).includes(t);

/* LES DEUX MOMENTS NE REPONDENT PAS PAREIL A UNE ETIQUETTE INCONNUE,
 * et c est voulu.
 *
 * A LA CREATION il faut bien ecrire QUELQUE CHOSE dans la colonne :
 * on retombe sur « other ». Rien n est perdu — les etiquettes sont de
 * toute facon enregistrees a part, par insertGoalTags.
 *
 * A LA MODIFICATION la colonne porte deja une valeur valide : ne rien
 * ecrire la laisse intacte, ce qui vaut mieux que la remplacer par
 * « other » au motif qu on a ajoute une etiquette decorative.
 */
export const TYPE_PAR_DEFAUT = "personal";
export const TYPE_DE_REPLI = "other";

/** A la creation : la premiere etiquette, ou « other » si l enum la refuse. */
export function typeALaCreation(etiquettes: string[]): TypeObjectif {
  const premiere = etiquettes[0] || TYPE_PAR_DEFAUT;
  return estTypeObjectif(premiere) ? premiere : TYPE_DE_REPLI;
}

/** A la modification : le type a ecrire, ou null pour ne pas y toucher. */
export function typeALaModification(etiquettes: string[], typeActuel: string | null | undefined): TypeObjectif | null {
  const premiere = etiquettes[0] || TYPE_PAR_DEFAUT;
  if (premiere === typeActuel) return null;
  return estTypeObjectif(premiere) ? premiere : null;
}
