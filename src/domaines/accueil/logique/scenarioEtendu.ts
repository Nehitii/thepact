/* LE SCENARIO, EN PROFONDEUR.
 *
 * Les deux mondes de la seconde serie demandent ce que les trois
 * structures n avaient pas besoin de connaitre :
 *
 *   - LES ETAPES NOMMEES de chaque objectif ouvert. Le reseau en fait
 *     ses stations ; le dossier en tape la suivante. En base, ce sont
 *     les lignes de « steps », dans leur « order ».
 *   - LA VALEUR QUE SERT CHAQUE OBJECTIF. Le pacte est jure sur trois
 *     valeurs ; un objectif qui n en sert aucune est un objectif hors
 *     pacte. Le dossier range l inventaire par valeur, le reseau en
 *     fait trois faisceaux de lignes. Cette relation n existe pas
 *     encore en base : c est une proposition, et elle est nommee ici.
 *
 * Tout reste fictif. Les longues lignes sont COMPRIMEES comme un plan
 * de metro le fait d une ligne express : les premieres stations, un
 * troncon « + n », les dernieres franchies, la suite. */

import type { ObjectifDuScenario } from "./scenarioDuTableau";

export type Valeur = "Liberté" | "Discipline" | "Création";

export const VALEUR_DE_L_OBJECTIF: Record<string, Valeur> = {
  salariat: "Liberté", epargne: "Liberté", voyage: "Liberté", moto: "Liberté",
  semi: "Discipline", mediter: "Discipline", japonais: "Discipline", souder: "Discipline",
  sucre: "Discipline", dixkm: "Discipline", garage: "Discipline",
  roman: "Création", atelier: "Création", lire: "Création", expo: "Création",
};

export interface Station {
  titre: string;
  faite: boolean;
  /** Un troncon comprime : « + 12 stations ». */
  saut?: number;
}

/** Les lignes du reseau : numero, couleur, et stations dans l ordre. */
export interface Ligne {
  objectif: string;
  numero: string;
  couleur: string;
  /** En projet : la ligne est dessinee, pas encore ouverte. */
  projet?: boolean;
  /** Une boucle : l habitude revient chaque jour a son depart. */
  boucle?: boolean;
  stations: Station[];
}

const f = (titre: string): Station => ({ titre, faite: true });
const a = (titre: string): Station => ({ titre, faite: false });
const saut = (n: number, faite: boolean): Station => ({ titre: `+ ${n} stations`, faite, saut: n });

export const LIGNES: readonly Ligne[] = [
  { objectif: "salariat", numero: "1", couleur: "#e8a23a", stations: [
    f("Premier devis"), f("Statut créé"), saut(11, true), f("Site en ligne"), f("Deux clients ponctuels"),
    a("Signer un premier client récurrent"), a("Trois mois d’avance"), saut(42, false), a("Démission"),
  ] },
  { objectif: "epargne", numero: "2", couleur: "#f2d02c", stations: [
    f("Compte ouvert"), saut(10, true), f("Virement de juillet"), f("Virement d’août"),
    a("Virement de septembre"), a("Octobre"), saut(4, false), a("10 000 €"),
  ] },
  { objectif: "voyage", numero: "2b", couleur: "#ff8a65", projet: true, stations: [
    a("Ouvrir la cagnotte"), a("Billets"), saut(11, false), a("Tokyo"),
  ] },
  { objectif: "semi", numero: "3", couleur: "#ef4a5a", stations: [
    f("5 km"), f("Plan d’entraînement"), f("8 km"), f("10 km"), f("12 km"), f("Fractionné"),
    f("Chaussures"), a("15 km sans marcher"), a("18 km"), a("Semi d’essai"), a("Affûtage"), a("Semi de Paris"),
  ] },
  { objectif: "mediter", numero: "4", couleur: "#3ecf8e", boucle: true, stations: [
    f("Jour 1"), saut(66, true), f("Jour 68"), a("Jour 69"), saut(20, false), a("Jour 90"),
  ] },
  { objectif: "japonais", numero: "5", couleur: "#8b9bff", stations: [
    f("Hiragana"), f("Katakana"), saut(5, true), f("Leçon 40"), a("Leçon 41 : la forme en -te"),
    a("Leçon 42"), saut(18, false), a("Examen N4"),
  ] },
  { objectif: "souder", numero: "5b", couleur: "#9aa6b8", projet: true, stations: [
    a("Trouver un atelier partagé"), a("Premier cordon"), saut(5, false), a("Portail soudé"),
  ] },
  { objectif: "roman", numero: "6", couleur: "#c07bff", stations: [
    f("Plan"), f("Chapitre 1"), f("Chapitre 3, relecture"), a("Chapitre 4, premier jet"), a("Chapitre 5"),
    saut(33, false), a("Manuscrit"),
  ] },
  { objectif: "atelier", numero: "7", couleur: "#2bb8c4", stations: [
    f("Vider"), f("Électricité"), f("Isolation"), f("Peinture"), f("Sol"),
    a("Poncer l’établi"), a("Rangements"), a("Éclairage"), a("Atelier ouvert"),
  ] },
  { objectif: "lire", numero: "8", couleur: "#ff6fae", stations: [
    f("Livre 1"), saut(14, true), f("Livre 16"), f("Livre 17"), a("Le Désert des Tartares"),
    a("Livre 19"), saut(4, false), a("24 livres"),
  ] },
];

/** La station ou se trouve le train : la premiere qui n est pas faite. */
export function stationCourante(l: Ligne): number {
  const i = l.stations.findIndex((s) => !s.faite && !s.saut);
  return i < 0 ? l.stations.length - 1 : i;
}

/** Le rythme recent, pour dire si le plan tient : des etapes franchies
 *  sur les trente derniers jours. Fictif, comme le reste. */
export const RYTHME = { jours: 30, etapes: 9 };

/** Combien d etapes restent aux objectifs qui en ont. */
export function etapesRestantes(objectifs: readonly ObjectifDuScenario[]): number {
  return objectifs.filter((o) => !o.habitude && o.statut !== "fully_completed")
    .reduce((s, o) => s + (o.etapes - o.faites), 0);
}
