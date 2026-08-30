import type { CostItemData, EditStepItem } from "@/domaines/objectifs/types";
import type { Json, Tables, TablesInsert } from "@/socle/supabase/types";
import type { TypeObjectif } from "@/domaines/objectifs/logique/typeDObjectif";

/** Le palier tel que la colonne le nomme : un enum, pas une chaine. */
export type Palier = NonNullable<Tables<"goals">["difficulty"]>;

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

/* ═══════════════════════════════════════════════════════════════
   LE JOUR CHOISI DEVIENT MINUIT UTC, PAS MINUIT CHEZ SOI.

   Le champ de date rend « 2026-08-30 ». `new Date("2026-08-30")` lit
   cette forme comme une date UTC — c est la specification, et c est
   l inverse de `new Date("2026/08/30")`, qui la lirait en heure
   locale. L instant enregistre est donc minuit UTC.

   MESURE LE 30/08/2026 : les 38 objectifs du compte portent tous
   exactement « 00:00:00+00 ». En France, un objectif qui « commence le
   15 fevrier » commence donc a 01h00 le 15 fevrier — deux heures en
   ete. Ce decalage se retrouve dans toute duree comptee depuis
   `start_date`, dont les honneurs de temps.

   ET LE DEFAUT DU CHAMP A LE MEME BIAIS, dans l autre sens : il vaut
   `new Date().toISOString().split("T")[0]`, c est-a-dire LE JOUR UTC.
   Entre minuit et deux heures du matin en France, le champ propose
   DONC LA VEILLE. Aucun des 38 objectifs n a ete cree dans cette
   fenetre — le plus tot l a ete a 13h48 — le defaut n a donc jamais
   menti sur ce compte.

   CONSTATE, NON CORRIGE : lire le jour en heure locale changerait
   l instant enregistre pour tout objectif cree ensuite, et la date
   proposee par le champ entre minuit et deux heures.
   ═══════════════════════════════════════════════════════════════ */
export function instantDuDepart(jour: string): string {
  return new Date(jour).toISOString();
}

/* ═══════════════════════════════════════════════════════════════
   LES ENFANTS D UN GROUPE, CALCULES UNE FOIS.

   Ils l etaient DEUX FOIS : une fois pour refuser un groupe vide, une
   fois pour ecrire la colonne. Deux appels au meme filtre sur la meme
   liste — d accord aujourd hui parce que rien ne bouge entre les deux,
   mais rien ne le garantissait.
   ═══════════════════════════════════════════════════════════════ */
/* « auto » ET NON « rule » : c est le nom que porte l etat de la
   page, et le renommer ici obligerait a traduire a chaque appel. */
export type ModeDeGroupe = "manual" | "auto";

export function enfantsDuGroupe(
  mode: ModeDeGroupe,
  selection: string[],
  parLaRegle: string[],
): string[] {
  return mode === "manual" ? selection : parLaRegle;
}

/* CE QU UN GROUPE ECRIT DANS SES TROIS COLONNES.
 *
 * UN GROUPE DYNAMIQUE NE GARDE PAS SA LISTE : `child_goal_ids` vaut
 * NULL, et c est la regle qui fait foi a chaque lecture. Y ecrire les
 * identifiants du moment ferait croire a une liste figee, que plus
 * rien ne mettrait a jour.
 *
 * ET UN GROUPE MANUEL N ECRIT PAS DE REGLE — pas meme nulle : la clef
 * est absente, donc la colonne garde son defaut. */
export interface ColonnesDuGroupe {
  child_goal_ids?: string[] | null;
  /* La regle est une colonne jsonb : le type applicatif est plus
     etroit que Json, et la conversion a lieu chez l appelant. */
  super_goal_rule?: Json;
  is_dynamic_super?: boolean;
}

export function colonnesDuGroupe(
  genre: GenreDObjectif,
  mode: ModeDeGroupe,
  selection: string[],
  parLaRegle: string[],
  regle: Json,
  dynamique: boolean,
): ColonnesDuGroupe {
  if (genre !== "super") return {};
  if (mode === "manual") return { child_goal_ids: selection, is_dynamic_super: false };
  return {
    child_goal_ids: dynamique ? null : parLaRegle,
    super_goal_rule: regle,
    is_dynamic_super: dynamique,
  };
}

/* ═══════════════════════════════════════════════════════════════
   LA LIGNE D UN OBJECTIF NEUF.

   Seize colonnes, dont cinq calculees et six qui choisissent entre une
   valeur et NULL. Elles etaient posees au milieu de l ecriture
   Supabase, ou aucune ne pouvait etre relue seule.

   TROIS COLONNES NE VALENT QUE POUR UNE HABITUDE — la duree, les jours
   coches — ou QUE POUR UN GROUPE. Les poser quand meme rendrait un
   objectif ordinaire porteur d une duree d habitude, que rien
   n afficherait mais que tout compte lirait.

   ET LE VIDE DEVIENT NULL, PAS LA CHAINE VIDE : une note vide, une
   image absente, une echeance non fixee. Une chaine vide en base se
   lit comme une valeur posee ; NULL se lit comme « rien ».
   ═══════════════════════════════════════════════════════════════ */
export interface SaisieDUnObjectif {
  pacteId: string;
  nom: string;
  /* Un enum lui aussi : logique/typeDObjectif.ts porte les neuf
     valeurs et le repli. */
  type: TypeObjectif;
  /* UN ENUM POSTGRES, PAS UNE CHAINE. Le declarer « string » compile
     ici et casse a l insertion — la lecon etait deja ecrite dans
     logique/duplication.ts. */
  palier: Palier;
  genre: GenreDObjectif;
  notes: string;
  etapes: EditStepItem[];
  joursDHabitude: number;
  pieces: CostItemData[];
  jourDeDepart: string;
  echeance: string;
  image: string;
  groupe: ColonnesDuGroupe;
}

/* LE TYPE DE LA TABLE, ET NON UN OBJET LIBRE. C est lui qui verifie
   que « status » et « difficulty » sont des enums, que « type » existe,
   et qu aucune colonne inventee ne descend jusqu a Postgres. */
export function objectifACreer(s: SaisieDUnObjectif): TablesInsert<"goals"> {
  return {
    pact_id: s.pacteId,
    name: s.nom,
    type: s.type,
    difficulty: s.palier,
    estimated_cost: totalChiffre(s.pieces),
    notes: s.notes || null,
    total_steps: totalDesEtapes(s.genre, s.etapes, s.joursDHabitude),
    potential_score: potentielDuPalier(s.palier),
    start_date: instantDuDepart(s.jourDeDepart),
    status: "not_started",
    goal_type: s.genre,
    habit_duration_days: s.genre === "habit" ? s.joursDHabitude : null,
    habit_checks: joursNeufs(s.genre, s.joursDHabitude),
    image_url: s.image || null,
    ...s.groupe,
    deadline: s.echeance || null,
  };
}
