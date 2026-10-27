/* LES ACCES RAPIDES DU TABLEAU DE BORD.
 *
 * Six gestes sous l enseigne : creer un objectif, ouvrir ses taches,
 * son journal, sa sante, faire la revue de la semaine, tirer une
 * mission. Les refontes de la barre les lisent toutes ici, pour qu
 * aucune ne se trompe de destination ni de verrou.
 *
 * ═══ DEUX CHOSES ONT CHANGE PAR RAPPORT A LA BARRE D ORIGINE ═══
 *
 * « NEW TASK » ET « TO-DO LIST » MENAIENT AU MEME ENDROIT, « /todo »,
 * sous le meme module. Deux cases pour une porte : il n en reste
 * qu une, « Tâches ».
 *
 * LES TOUCHES F1 A F7 NE FAISAIENT RIEN. Elles etaient ecrites sur les
 * cases, et aucun ecouteur ne les attendait — F1 ouvre l aide du
 * navigateur, F5 recharge la page. Une touche promise qui ne repond
 * pas est pire que pas de touche : elles ne sont plus affichees. */

export type IdAcces = "objectif" | "taches" | "journal" | "sante" | "revue" | "tirage";

/** Les modules de la boutique qui verrouillent un acces. */
export type ModuleDAcces = "todo-list" | "journal" | "track-health";

export interface Acces {
  id: IdAcces;
  /** Le nom de l acces, tel qu on le lit. */
  libelle: string;
  /** Ce qu il fait, en quelques mots, pour les refontes qui ont la place. */
  geste: string;
  /** La couleur de l acces, choisie pour briller sur du noir. */
  couleur: string;
  module: ModuleDAcces | null;
  /** La page ou il mene ; « null » pour les deux qui ouvrent un outil ici. */
  route: string | null;
}

export const ACCES: readonly Acces[] = [
  { id: "objectif", libelle: "Nouvel objectif", geste: "En créer un", couleur: "#00d4ff", module: null, route: "/goals/new" },
  { id: "taches", libelle: "Tâches", geste: "La liste du jour", couleur: "#ffc93a", module: "todo-list", route: "/todo" },
  { id: "journal", libelle: "Journal", geste: "Écrire la journée", couleur: "#b264ff", module: "journal", route: "/journal" },
  { id: "sante", libelle: "Santé", geste: "Le corps, les jours", couleur: "#19f08a", module: "track-health", route: "/health" },
  { id: "revue", libelle: "Revue de la semaine", geste: "Faire le point", couleur: "#8b93ff", module: null, route: null },
  { id: "tirage", libelle: "Tirage de mission", geste: "Laisser le sort choisir", couleur: "#ff8c1a", module: null, route: null },
];

/** L etat d un acces, calcule une fois pour toutes les refontes. */
export interface EtatDAcces {
  /** Le module n est pas achete : l acces mene a la boutique. */
  verrouille: boolean;
  /** Le tirage est deja pris : une mission est en cours. */
  indisponible: boolean;
  /** Le tirage est ouvert sur la page. */
  ouvert: boolean;
  /** L info-bulle et le nom accessible : ce que fait l appui. */
  titre: string;
}

export function etatDAcces(
  a: Acces,
  modulesAchetes: Readonly<Record<ModuleDAcces, boolean>>,
  tirage: { ouvert: boolean; disponible: boolean },
): EtatDAcces {
  const verrouille = a.module !== null && !modulesAchetes[a.module];
  const estLeTirage = a.id === "tirage";
  const indisponible = estLeTirage && !tirage.disponible;
  const ouvert = estLeTirage && tirage.ouvert && !indisponible;
  const titre = verrouille
    ? `${a.libelle} — à débloquer dans la boutique`
    : indisponible
      ? "Une mission est déjà en cours"
      : estLeTirage
        ? (ouvert ? "Fermer le tirage de mission" : "Ouvrir le tirage de mission")
        : a.libelle;
  return { verrouille, indisponible, ouvert, titre };
}
