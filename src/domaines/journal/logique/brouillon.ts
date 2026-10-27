/* LE BROUILLON D UNE ENTREE DE JOURNAL.
 *
 * Ce qui a ete tape et jamais enregistre revient a l ouverture
 * suivante. Trois decisions le gouvernent, et aucune n etait
 * relisable : ou le brouillon se range, quand il s ecrit, et ce qui
 * l emporte quand il contredit l entree.
 */

/* TOUTES LES NOUVELLES ENTREES PARTAGENT UNE SEULE CLE.
 *
 * « journal-draft-new » : commencer une entree, la quitter sans
 * enregistrer, puis en commencer une AUTRE fait revenir le brouillon
 * de la premiere. Une entree en cours de modification, elle, a sa
 * propre cle — son identifiant. C est constate, pas arbitre : ranger
 * les brouillons neufs separement demanderait de decider quand les
 * oublier, et un brouillon orphelin qui traine est pire qu un
 * brouillon qui revient. */
export const PREFIXE_BROUILLON = "journal-draft-";
export const CLE_NEUVE = "new";

export function cleDuBrouillon(idDeLEntree?: string): string {
  return `${PREFIXE_BROUILLON}${idDeLEntree ?? CLE_NEUVE}`;
}

/* QUATRE CENTS MILLISECONDES APRES LA DERNIERE FRAPPE.
 *
 * Ecrire a chaque touche ferait une ecriture par caractere dans le
 * stockage local ; attendre plus longtemps perdrait ce qui vient
 * d etre tape si l onglet se ferme. */
export const DELAI_BROUILLON = 400;

/* ── CE QUE PORTE UNE ENTREE ─────────────────────────────────── */

export interface ValeursDeLEntree {
  title: string;
  content: string;
  lifeContext: string;
  valence: number;
  energy: number;
  linkedGoalId: string | null;
  tags: string[];
  accentId: string;
  moodId: string;
  fontId: string;
  sizeId: string;
  alignId: string;
  lineNums: boolean;
}

/* LES TREIZE DEFAUTS, UNE SEULE FOIS. Ils etaient ecrits deux fois —
   une branche pour une entree existante, une pour une entree neuve —
   et la seconde n etait qu une liste de valeurs par defaut. Ajouter
   un champ a l une sans l autre le laissait indefini a la creation. */
export const VALEURS_NEUVES: ValeursDeLEntree = {
  title: "",
  content: "",
  lifeContext: "",
  /* CINQ SUR DIX : le milieu de l echelle, pas zero. Une entree sans
     humeur declaree n est pas une entree au plus bas. */
  valence: 5,
  energy: 5,
  linkedGoalId: null,
  tags: [],
  accentId: "cyan",
  moodId: "flow",
  fontId: "mono",
  sizeId: "md",
  alignId: "left",
  lineNums: false,
};

/** Ce qu une entree existante apporte, colonne par colonne. */
export interface EntreeLue {
  title: string;
  content: string;
  life_context?: string | null;
  valence_level?: number | null;
  energy_level?: number | null;
  linked_goal_id?: string | null;
  tags?: string[] | null;
  accent_color?: string | null;
  mood?: string | null;
  font_id?: string | null;
  size_id?: string | null;
  align_id?: string | null;
  line_numbers?: boolean | null;
}

/* CHAQUE COLONNE NULLE RETOMBE SUR SON DEFAUT — et l operateur
   compte : « ?? » pour les nombres et les booleens, parce que ZERO et
   FAUX sont des valeurs qu on veut garder ; « || » pour le contexte
   de vie, parce qu une chaine vide et une absence disent la meme
   chose ici. */
export function valeursDeLEntree(
  entree: EntreeLue,
  nettoyer: (html: string) => string,
): ValeursDeLEntree {
  return {
    title: entree.title,
    content: nettoyer(entree.content),
    lifeContext: entree.life_context || VALEURS_NEUVES.lifeContext,
    valence: entree.valence_level ?? VALEURS_NEUVES.valence,
    energy: entree.energy_level ?? VALEURS_NEUVES.energy,
    linkedGoalId: entree.linked_goal_id ?? null,
    tags: entree.tags ?? [],
    accentId: entree.accent_color ?? VALEURS_NEUVES.accentId,
    moodId: entree.mood ?? VALEURS_NEUVES.moodId,
    fontId: entree.font_id ?? VALEURS_NEUVES.fontId,
    sizeId: entree.size_id ?? VALEURS_NEUVES.sizeId,
    alignId: entree.align_id ?? VALEURS_NEUVES.alignId,
    lineNums: entree.line_numbers ?? VALEURS_NEUVES.lineNums,
  };
}

/* UNE ENTREE NEUVE, AVEC L AMORCE DU JOUR SI ELLE EST PROPOSEE.
 *
 * LE TABLEAU D ETIQUETTES EST RECOPIE, et ce n est pas une precaution
 * de style : « { ...VALEURS_NEUVES } » est une copie DE SURFACE, donc
 * les deux appels partageraient le meme tableau. Ajouter une
 * etiquette a une entree neuve la ferait apparaitre dans la suivante,
 * et dans toutes les autres — la constante elle-meme serait
 * corrompue. Le code d origine construisait un littéral neuf a chaque
 * ouverture, donc n avait pas ce probleme ; c est la mise en commun
 * qui l a cree, et un test l a attrapee avant qu elle ne parte. */
export function valeursNeuves(amorce?: string): ValeursDeLEntree {
  return {
    ...VALEURS_NEUVES,
    tags: [...VALEURS_NEUVES.tags],
    content: amorce ? `<p>${amorce}</p>` : "",
  };
}

/* ── LE BROUILLON RETROUVE ───────────────────────────────────── */

/* LE BROUILLON RECOUVRE LE DEPART, CHAMP PAR CHAMP.
 *
 * C est ce qu on veut : ce qui a ete tape doit revenir. Mais cela
 * veut aussi dire qu un brouillon VIEUX recouvre une entree modifiee
 * ailleurs depuis — depuis un autre onglet, ou une autre machine —
 * sans rien demander. Le depart sert de socle : un champ ajoute
 * depuis l ecriture du brouillon garde sa valeur d aujourd hui.
 *
 * Un brouillon illisible est IGNORE, pas efface : le lire echoue,
 * mais rien ne dit qu il ne redeviendra pas lisible apres une mise a
 * jour. */
export function valeursRestaurees(
  depart: ValeursDeLEntree,
  brut: string | null,
): ValeursDeLEntree | null {
  if (!brut) return null;
  try {
    return { ...depart, ...(JSON.parse(brut) as Partial<ValeursDeLEntree>) };
  } catch {
    return null;
  }
}

/* ── CE QUI COMPTE COMME UNE MODIFICATION ────────────────────── */

export function empreinteDesValeurs(v: ValeursDeLEntree): string {
  return JSON.stringify(v);
}

/* TANT QUE L EMPREINTE DE DEPART EST VIDE, RIEN N EST SALE : la
   fenetre n a pas fini de s ouvrir, et tout ce qu on comparerait
   serait un etat transitoire. C est la meme garde que l atelier des
   objectifs. */
export function estSale(empreinteInitiale: string, valeurs: ValeursDeLEntree): boolean {
  if (empreinteInitiale === "") return false;
  return empreinteDesValeurs(valeurs) !== empreinteInitiale;
}

/** Faut-il ecrire le brouillon ? Non tant que rien n a bouge. */
export function faudraEcrireLeBrouillon(
  empreinteInitiale: string,
  valeurs: ValeursDeLEntree,
): boolean {
  return estSale(empreinteInitiale, valeurs);
}
