/* CE QU ON PROPOSE, ET RIEN DE PLUS.
 *
 * Les symboles, les couleurs, les valeurs suggerees et les quatre
 * gabarits d objectif vivaient en dur dans la page, libelles francais
 * compris. Ils descendent ici, DEPOUILLES DE LEURS TEXTES : ce module
 * ne porte que ce qui est structurel — un identifiant, une difficulte,
 * un nombre d etapes. Les mots sont dans « fr.json » et « en.json »,
 * ou ils doivent etre.
 *
 * Les icones restent dehors aussi : « logique » ne connait pas de
 * composant, et une icone en est un. Le rendu fait la correspondance.
 */
import type { GabaritDObjectif } from "@/domaines/onboarding/logique/premierObjectif";

/** Les quatre symboles du sceau. La base a « flame » par defaut. */
export const SYMBOLES = ["flame", "heart", "target", "sparkles"] as const;
export type Symbole = (typeof SYMBOLES)[number];

/** Les six couleurs du pacte. La base a « amber » par defaut. */
export const COULEURS = ["amber", "rose", "emerald", "sky", "violet", "cyan"] as const;
export type Couleur = (typeof COULEURS)[number];

/**
 * Les valeurs proposees — douze, et on peut en ecrire d autres.
 *
 * Ce sont des CLES, pas des mots : « onboarding.valeurs.liberte ». Une
 * suggestion ecrite en dur en francais serait le seul endroit du rite
 * que l anglais ne traduirait pas.
 */
export const VALEURS_SUGGEREES = [
  "liberte", "excellence", "famille", "croissance",
  "discipline", "honnetete", "aventure", "impact",
  "sagesse", "sante", "creation", "serenite",
] as const;

/** Ce qu un gabarit d objectif porte de structurel. */
export interface Gabarit {
  id: string;
  difficulte: "easy" | "medium" | "hard" | "extreme" | "impossible";
  typeDObjectif: "normal" | "habit";
  /** Le nombre annonce sur la carte. */
  etapes: number;
  /** Ce qui s ecrit en base — voir « premierObjectif.ts ». */
  totalEtapes?: number;
  joursDHabitude?: number;
}

/* LE NOMBRE ANNONCE ET LE TOTAL ECRIT SONT DEUX CHAMPS DISTINCTS qui
   portent le meme nombre : « etapes » s affiche, « totalEtapes »
   s enregistre. Rien ne les tient d accord — l ancienne page portait
   deja la remarque, elle reste vraie. */
export const GABARITS: readonly Gabarit[] = [
  { id: "30day-habit", difficulte: "medium", typeDObjectif: "habit", joursDHabitude: 30, etapes: 30 },
  { id: "fitness", difficulte: "hard", typeDObjectif: "normal", totalEtapes: 5, etapes: 5 },
  { id: "skill", difficulte: "medium", typeDObjectif: "normal", totalEtapes: 5, etapes: 5 },
  { id: "project", difficulte: "hard", typeDObjectif: "normal", totalEtapes: 8, etapes: 8 },
];

/**
 * Le gabarit, mis dans la forme que l insertion attend.
 *
 * « exemple » vient de la traduction et devient le NOM de l objectif :
 * « premierObjectif.ts » ecrit le placeholder dans « goals.name ».
 * C est voulu — le premier objectif porte l exemple qu on a montre,
 * et le porteur le renommera s il veut autre chose.
 */
export function versObjectif(g: Gabarit, exemple: string): GabaritDObjectif {
  return {
    placeholder: exemple,
    difficulty: g.difficulte,
    goal_type: g.typeDObjectif,
    total_steps: g.totalEtapes,
    habit_duration_days: g.joursDHabitude,
  };
}
