import type { CostItemData, EditStepItem } from "@/domaines/objectifs/types";

/* CE QU ON ECRIT QUAND ON CREE UN OBJECTIF.
 *
 * Cinq calculs vivaient au milieu de six ecritures Supabase, la ou
 * personne ne les relit : le score que l objectif vaudra, le total
 * qui servira d avancement, la somme de ses pieces chiffrees, et les
 * deux listes qui suivent.
 */

/* CE QUE VAUT UN OBJECTIF SELON SON PALIER.
 *
 * Le repli a 25 n est pas une precaution : « custom » vaut 500, et un
 * palier inconnu vaut autant qu un palier moyen plutot que zero. Un
 * objectif qui ne rapporterait rien serait indistinguable d un
 * objectif qu on n a pas fait. */
export const POTENTIELS = {
  easy: 10, medium: 25, hard: 50, extreme: 100, impossible: 200, custom: 500,
} as const;
export const POTENTIEL_PAR_DEFAUT = POTENTIELS.medium;

export function potentielDuPalier(palier: string): number {
  return POTENTIELS[palier as keyof typeof POTENTIELS] ?? POTENTIEL_PAR_DEFAUT;
}

export type GenreDObjectif = "normal" | "habit" | "super";

/* LE TOTAL QUI SERT D AVANCEMENT.
 *
 * Un objectif ordinaire compte ses etapes SANS l etape ultime — elle
 * est un bonus, elle ouvre le zenith et ne fait pas avancer. Une
 * habitude compte ses jours. Un GROUPE compte zero : ses membres ne
 * sont pas des etapes, et son avancement se recalcule ailleurs, a
 * partir d eux. */
export function totalDesEtapes(
  genre: GenreDObjectif,
  etapes: EditStepItem[],
  joursDHabitude: number,
): number {
  if (genre === "normal") return etapes.filter((e) => !e.estUltime).length;
  if (genre === "habit") return joursDHabitude;
  return 0;
}

/** Les jours d une habitude neuve : un tableau de faux, un par jour. */
export function joursNeufs(genre: GenreDObjectif, joursDHabitude: number): boolean[] | null {
  return genre === "habit" ? (Array(joursDHabitude).fill(false) as boolean[]) : null;
}

/* LA SOMME DES PIECES CHIFFREES.
 *
 * « price || 0 » et non « Number(price) || 0 » : le champ est deja un
 * nombre, mais il peut etre NaN si la saisie a ete videe. Sans ce
 * repli, une seule piece sans prix rendrait le cout total NaN, et
 * l objectif s enregistrerait avec un cout qui ne s affiche pas. */
export function totalChiffre(pieces: { price?: number | null }[]): number {
  return pieces.reduce((somme, p) => somme + (p.price || 0), 0);
}

/* LES ETAPES QU ON INSERE.
 *
 * Le rang est refait de un a n, et une etape sans titre en recoit un
 * plutot que d entrer vide en base. */
export function etapesACreer(etapes: EditStepItem[], objectifId: string, titreParDefaut: (rang: number) => string) {
  return etapes.map((e, i) => ({
    goal_id: objectifId,
    title: e.name?.trim() || titreParDefaut(i + 1),
    description: "",
    notes: "",
    order: i + 1,
    exclude_from_spin: e.excludeFromSpin ?? false,
    is_ultimate: e.estUltime ?? false,
  }));
}

/* LES PIECES CHIFFREES QU ON INSERE, ET LEUR ETAPE.
 *
 * Avant l enregistrement, une piece pointe une etape par son RANG
 * (« step-index-3 ») : les etapes n ont pas encore d identifiant. Une
 * fois inserees, on traduit ce rang en identifiant reel. Une piece
 * dont le rang ne correspond a rien est detachee plutot que rattachee
 * au hasard. */
export const PREFIXE_RANG = "step-index-";

export function piecesACreer(
  pieces: CostItemData[],
  objectifId: string,
  etapesCreees: { id: string; order: number }[],
) {
  const parRang = new Map(etapesCreees.map((e) => [`${PREFIXE_RANG}${e.order - 1}`, e.id]));
  return pieces.map((p) => ({
    goal_id: objectifId,
    name: p.name,
    price: p.price || 0,
    category: p.category || null,
    step_id: p.stepId ? parRang.get(p.stepId) || null : null,
  }));
}

/* ECHAP NE FERME QUE TANT QUE RIEN N A ETE SAISI.
 *
 * Au-dela il jetterait un formulaire a moitie rempli sans rien
 * demander, la ou l atelier, lui, a une garde sur les modifications
 * non enregistrees. LES ETAPES PAR DEFAUT NE COMPTENT PAS comme une
 * saisie : elles sont la avant qu on ait touche a quoi que ce soit. */
export function rienDeSaisi(f: {
  nom: string;
  notes: string;
  image: string;
  pieces: unknown[];
  membres: unknown[];
}): boolean {
  return (
    !f.nom.trim() && !f.notes.trim() && !f.image &&
    f.pieces.length === 0 && f.membres.length === 0
  );
}

/* ── LES BORNES DU FORMULAIRE ────────────────────────────────── */

/* CES QUATRE NOMBRES ETAIENT ECRITS TROIS FOIS CHACUN : dans le schema
 * de validation, dans les attributs `min` et `max` du champ, et dans le
 * calcul qui borne la saisie. Trois copies d une meme borne, et rien
 * qui les tienne ensemble : en changer une laissait les deux autres
 * mentir.
 *
 * VINGT ETAPES, TROIS CENT SOIXANTE-CINQ JOURS. La premiere borne est
 * un choix d ecran — au-dela, la liste ne se relit plus ; la seconde
 * est une annee. */
export const ETAPES_MIN = 1;
export const ETAPES_MAX = 20;
export const JOURS_MIN = 1;
export const JOURS_MAX = 365;

/** Cinq etapes sont posees d avance, avant toute saisie. */
export const ETAPES_AU_DEPART = 5;

/* LE ZERO N ARRIVE JAMAIS JUSQU AU MINIMUM : `parseInt("0")` rend zero,
   que le `|| JOURS_MIN` remplace avant meme la borne. Les deux gardes
   donnent le meme resultat ici, et c est le premier qui agit. */
export function joursDHabitudeBornes(saisie: string): number {
  return Math.max(JOURS_MIN, Math.min(JOURS_MAX, parseInt(saisie) || JOURS_MIN));
}

/* LA DECOUPE PROPOSEE EST COUPEE A VINGT, SANS UN MOT. Si le modele en
   rend vingt-cinq, les cinq dernieres disparaissent et rien ne le dit —
   ni a l ecran, ni dans la console. Constate, non corrige : le dire
   changerait ce que l ecran affiche. */
export function etapesSuggereesRetenues<T>(etapes: T[]): T[] {
  return etapes.slice(0, ETAPES_MAX);
}

/* LE TITRE D UNE ETAPE SANS NOM. Il est en anglais, et il part EN BASE :
   les objectifs deja crees en portent. Le traduire changerait ce que
   l ecran affiche et desaccorderait les anciens des neufs. */
export function titreParDefautDUneEtape(rang: number): string {
  return `Step ${rang}`;
}
