/* LE SCENARIO DU BANC DU TABLEAU DE BORD.
 *
 * Trois refontes se comparent sur le meme contenu : sans cela, on
 * jugerait des donnees, pas des structures. Tout ici est FICTIF — un
 * pacte « Ananta », quinze objectifs, une journee de mercredi — mais
 * chaque forme suit celle de la base : un objectif a ses etapes et sa
 * prochaine, un ordre sa cible et sa prime, une mission son echeance.
 * C est ce qui permettra de brancher la structure retenue sur les
 * vraies donnees sans la redessiner.
 *
 * L HEURE EST FIXEE : mercredi 23 septembre 2026, 19 h 42. Le journal
 * de la journee et ce qui vient ensuite ne tiennent ensemble qu a une
 * heure donnee — a 10 h, l entree de 18 h 20 serait dans le futur. */

export type Difficulte = "easy" | "medium" | "hard" | "extreme" | "impossible" | "custom";

export interface ObjectifDuScenario {
  id: string;
  nom: string;
  difficulte: Difficulte;
  statut: "not_started" | "in_progress" | "fully_completed";
  etapes: number;
  faites: number;
  echeance?: string;
  focus?: boolean;
  prochaine?: { titre: string; due?: string };
  /** Une habitude compte des jours coches, pas des etapes. */
  habitude?: { jours: number; coches: number };
}

export interface OrdreDuJour {
  id: string;
  titre: string;
  progres: number;
  cible: number;
  prime: number;
  reclame: boolean;
}

export type GenreDEntree = "habitude" | "ordre" | "etape" | "journal" | "tache";

export interface EntreeDuJour {
  heure: string;
  genre: GenreDEntree;
  titre: string;
  detail?: string;
  /** L ordre qui l a produite : c est par lui que la prime vole du rail au registre. */
  ordre?: string;
}

export interface Echeance {
  date: string;
  genre: "ordres" | "mission" | "revue" | "etape" | "objectif" | "pacte";
  titre: string;
  detail?: string;
}

export const MAINTENANT = new Date(2026, 8, 23, 19, 42);

export const PACTE = {
  nom: "Ananta",
  mantra: "Tenir ce qui est juré",
  symbole: "flame",
  valeurs: ["Liberté", "Discipline", "Création"] as const,
  version: 4,
  teinte: "#8B5CF6",
  debut: new Date(2023, 10, 1),
  fin: new Date(2029, 11, 22),
  /** Le nom que le porteur a donne a son palier personnel. */
  palierPerso: "Ananta",
};

export const RANG = { nom: "Architecte", niveau: 12, xp: 3200, cible: 5000, suivant: "Bâtisseur", teinte: "#5bb4ff" };

export const BONDS = 1240;

export const OBJECTIFS: readonly ObjectifDuScenario[] = [
  { id: "salariat", nom: "Quitter le salariat", difficulte: "custom", statut: "in_progress", etapes: 62, faites: 15,
    echeance: "2029-06-30", focus: true, prochaine: { titre: "Signer un premier client récurrent" } },
  { id: "semi", nom: "Courir un semi-marathon", difficulte: "hard", statut: "in_progress", etapes: 12, faites: 7,
    echeance: "2027-04-12", focus: true, prochaine: { titre: "Tenir 15 km sans marcher", due: "2026-09-26T18:00" } },
  { id: "lire", nom: "Lire 24 livres cette année", difficulte: "medium", statut: "in_progress", etapes: 24, faites: 17,
    echeance: "2026-12-31", focus: true, prochaine: { titre: "Finir « Le Désert des Tartares »" } },
  { id: "epargne", nom: "Épargner 10 000 €", difficulte: "extreme", statut: "in_progress", etapes: 20, faites: 13,
    echeance: "2027-06-30", prochaine: { titre: "Virement de septembre", due: "2026-09-30" } },
  { id: "japonais", nom: "Japonais, niveau N4", difficulte: "hard", statut: "in_progress", etapes: 30, faites: 9,
    echeance: "2028-03-01", prochaine: { titre: "Leçon 41 : la forme en -te" } },
  { id: "roman", nom: "Écrire un roman", difficulte: "impossible", statut: "in_progress", etapes: 40, faites: 3,
    echeance: "2029-12-01", prochaine: { titre: "Chapitre 4, premier jet" } },
  { id: "atelier", nom: "Rénover l’atelier", difficulte: "medium", statut: "in_progress", etapes: 9, faites: 5,
    echeance: "2026-11-15", prochaine: { titre: "Poncer l’établi", due: "2026-10-04" } },
  { id: "mediter", nom: "Méditer dix minutes par jour", difficulte: "easy", statut: "in_progress", etapes: 0, faites: 0,
    habitude: { jours: 90, coches: 68 } },
  { id: "souder", nom: "Apprendre à souder", difficulte: "hard", statut: "not_started", etapes: 8, faites: 0,
    echeance: "2027-09-01", prochaine: { titre: "Trouver un atelier partagé" } },
  { id: "voyage", nom: "Voyage au Japon", difficulte: "extreme", statut: "not_started", etapes: 15, faites: 0,
    echeance: "2028-04-01", prochaine: { titre: "Ouvrir la cagnotte du voyage" } },
  { id: "sucre", nom: "Arrêter le sucre raffiné", difficulte: "easy", statut: "fully_completed", etapes: 1, faites: 1 },
  { id: "moto", nom: "Permis moto", difficulte: "hard", statut: "fully_completed", etapes: 10, faites: 10 },
  { id: "dixkm", nom: "Courir 10 km", difficulte: "medium", statut: "fully_completed", etapes: 6, faites: 6 },
  { id: "garage", nom: "Ranger le garage", difficulte: "easy", statut: "fully_completed", etapes: 3, faites: 3 },
  { id: "expo", nom: "Première exposition photo", difficulte: "extreme", statut: "fully_completed", etapes: 12, faites: 12 },
];

export const ORDRES: readonly OrdreDuJour[] = [
  { id: "deux-etapes", titre: "Franchir deux étapes", progres: 1, cible: 2, prime: 30, reclame: false },
  { id: "journal", titre: "Écrire dans le journal", progres: 1, cible: 1, prime: 20, reclame: false },
  { id: "habitude", titre: "Pointer une habitude", progres: 1, cible: 1, prime: 15, reclame: true },
];

export const MISSION = {
  titre: "Tenir 15 km sans marcher",
  objectif: "Courir un semi-marathon",
  objectifId: "semi",
  echeance: new Date(2026, 8, 26, 18, 0),
};

export const JOURNEE: readonly EntreeDuJour[] = [
  { heure: "07:12", genre: "habitude", titre: "Méditer dix minutes", detail: "68ᵉ jour sur 90" },
  { heure: "07:13", genre: "ordre", titre: "Ordre tenu : pointer une habitude", detail: "+15 bonds", ordre: "habitude" },
  { heure: "08:40", genre: "etape", titre: "Chapitre 3, relecture", detail: "Écrire un roman · 3 sur 40" },
  { heure: "12:05", genre: "journal", titre: "Une entrée au journal", detail: "412 mots" },
  { heure: "18:20", genre: "tache", titre: "Renouveler la carte de bibliothèque", detail: "Tâches" },
];

export const A_VENIR: readonly Echeance[] = [
  { date: "2026-09-24T02:00", genre: "ordres", titre: "Les ordres du jour tombent", detail: "un à réclamer, un en cours" },
  { date: "2026-09-26T18:00", genre: "mission", titre: "Tenir 15 km sans marcher", detail: "Courir un semi-marathon" },
  { date: "2026-09-28T20:00", genre: "revue", titre: "Revue de la semaine" },
  { date: "2026-09-30", genre: "etape", titre: "Virement de septembre", detail: "Épargner 10 000 €" },
  { date: "2026-10-04", genre: "etape", titre: "Poncer l’établi", detail: "Rénover l’atelier" },
  { date: "2026-11-15", genre: "objectif", titre: "Rénover l’atelier", detail: "5 étapes sur 9" },
  { date: "2026-12-31", genre: "objectif", titre: "Lire 24 livres cette année", detail: "17 sur 24" },
  { date: "2027-04-12", genre: "objectif", titre: "Courir un semi-marathon", detail: "7 étapes sur 12" },
  { date: "2029-12-22", genre: "pacte", titre: "Fin du pacte Ananta" },
];

/** Les cinq systemes du pouls, et ce qui a ete touche aujourd hui. */
export const POULS = [
  { nom: "Tâches", etat: "plein" },
  { nom: "Journal", etat: "plein" },
  { nom: "Habitudes", etat: "plein" },
  { nom: "Santé", etat: "amorce" },
  { nom: "Focus", etat: "eteint" },
] as const;

export const NOMS_DES_PALIERS: Record<Difficulte, string> = {
  easy: "Facile", medium: "Moyen", hard: "Difficile", extreme: "Extrême", impossible: "Impossible",
  custom: PACTE.palierPerso,
};

/* Les teintes des paliers sont celles du monitoring actuel : un
   palier garde sa couleur d un ecran a l autre. */
export const TEINTES_DES_PALIERS: Record<Difficulte, string> = {
  easy: "#00ff88", medium: "#00d4ff", hard: "#ff8c00", extreme: "#ff3366", impossible: "#cc00ff", custom: "#ff00aa",
};

export const ORDRE_DES_PALIERS: readonly Difficulte[] = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
