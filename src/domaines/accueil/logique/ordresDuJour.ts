import type { OrdreAffiche } from "@/domaines/accueil/types";

/* LES ORDRES DU JOUR, LUS POUR ETRE DESSINES.
 *
 * Trois ordres par jour au plus, tires par la base de quatre genres
 * (`assurer_ordres_du_jour`) : avancer un pas, tenir le rituel, la
 * conscience ecrite, le focus profond. Chacun porte une cible, une
 * progression, une prime en bonds et un statut — actif, atteint,
 * reclame.
 *
 * Les refontes du panneau lisent toutes la journee de la meme facon :
 * cette lecture vit donc ici, une fois, et se teste. Ce que chacune en
 * fait — des lettres de neon, des trous dans une carte, des batons a
 * la craie — reste dans son composant, mais le calcul de ces trous et
 * de ces batons est ici aussi. */

export type GenreDOrdre = "complete_steps" | "log_habit" | "journal_entry" | "focus_minutes";

export interface Genre {
  /** Le mot court d une etiquette : « Pas », « Rituel »… */
  court: string;
  couleur: string;
  /** L unite de la cible quand elle en a une : « min ». */
  unite: string;
}

/* Les couleurs rejoignent celles de la rue d enseignes, juste au-dessus :
   avancer un pas est cyan comme « Nouvel objectif », la conscience ecrite
   violette comme le journal. Le rituel prend la braise, le focus le rose
   des neons de nuit. */
export const GENRES: Readonly<Record<GenreDOrdre, Genre>> = {
  complete_steps: { court: "Pas", couleur: "#00d4ff", unite: "" },
  log_habit: { court: "Rituel", couleur: "#ff6b3d", unite: "" },
  journal_entry: { court: "Journal", couleur: "#b264ff", unite: "" },
  focus_minutes: { court: "Focus", couleur: "#ff4fa0", unite: "min" },
};

const INCONNU: Genre = { court: "Ordre", couleur: "#9aa7ba", unite: "" };

/** Un genre que la base ajouterait demain ne casse rien : il sort en gris. */
export const genreDe = (kind: string): Genre => GENRES[kind as GenreDOrdre] ?? INCONNU;

export interface LectureDOrdre {
  /** De 0 a 1. */
  fraction: number;
  /** De 0 a 100. Il ne touche 100 qu atteint : 199 sur 200 affiche 99. */
  pct: number;
  /** Atteint et pas encore reclame : la prime attend qu on la prenne. */
  prete: boolean;
  reclamee: boolean;
  /** Ce qu il reste a faire, dans l unite de l ordre. */
  restant: number;
}

export function lireLOrdre(o: OrdreAffiche): LectureDOrdre {
  const fraction = Math.min(1, Math.max(0, o.progress / Math.max(1, o.target)));
  const reclamee = o.status === "claimed";
  return {
    fraction,
    pct: fraction >= 1 ? 100 : Math.min(99, Math.floor(fraction * 100)),
    prete: !reclamee && o.progress >= o.target,
    reclamee,
    restant: Math.max(0, o.target - o.progress),
  };
}

export type EtatDeLaJournee = "vide" | "en-cours" | "a-reclamer" | "close";

export interface LectureDeLaJournee {
  primeTotale: number;
  primeAcquise: number;
  /** Les primes atteintes qui attendent d etre prises. */
  primeEnAttente: number;
  /** La part acquise de la prime, de 0 a 100. */
  pctPrime: number;
  reclames: number;
  pretes: number;
  etat: EtatDeLaJournee;
}

export function lireLaJournee(ordres: readonly OrdreAffiche[]): LectureDeLaJournee {
  let primeTotale = 0;
  let primeAcquise = 0;
  let primeEnAttente = 0;
  let reclames = 0;
  let pretes = 0;
  for (const o of ordres) {
    const prime = o.reward_bonds || 0;
    const l = lireLOrdre(o);
    primeTotale += prime;
    if (l.reclamee) {
      primeAcquise += prime;
      reclames += 1;
    } else if (l.prete) {
      primeEnAttente += prime;
      pretes += 1;
    }
  }
  const etat: EtatDeLaJournee =
    ordres.length === 0 ? "vide"
      : reclames === ordres.length ? "close"
        : pretes > 0 ? "a-reclamer"
          : "en-cours";
  return {
    primeTotale,
    primeAcquise,
    primeEnAttente,
    pctPrime: primeTotale > 0 ? Math.round((primeAcquise / primeTotale) * 100) : 0,
    reclames,
    pretes,
    etat,
  };
}

export interface Cloture {
  /** Millisecondes avant minuit UTC. */
  ms: number;
  heures: number;
  minutes: number;
  /** « 5 h 12 », « 20 min », « < 1 min ». */
  texte: string;
  /** « 05:12 », pour un afficheur. */
  horloge: string;
  /** L heure de la cloture a la montre du lecteur : « 2 h » l ete a Paris. */
  heureLocale: string;
}

const deux = (n: number) => String(n).padStart(2, "0");

/* LES ORDRES TOMBENT A MINUIT UTC, pas a minuit ici : la base les date
   et les fait progresser en UTC (voir `useDailyQuests`). A Paris, c est
   deux heures du matin l ete, une heure l hiver — d ou l heure locale,
   que le panneau d avant ne donnait pas. */
export function laCloture(maintenant: number): Cloture {
  const d = new Date(maintenant);
  const fin = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  const ms = fin - maintenant;
  const heures = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const locale = new Date(fin);
  const ml = locale.getMinutes();
  return {
    ms,
    heures,
    minutes,
    texte: heures > 0 ? `${heures} h ${deux(minutes)}` : minutes > 0 ? `${minutes} min` : "< 1 min",
    horloge: `${deux(heures)}:${deux(minutes)}`,
    heureLocale: ml ? `${locale.getHours()} h ${deux(ml)}` : `${locale.getHours()} h`,
  };
}

/* LA VITRINE. Combien de lettres du titre sont allumees : la part faite,
   arrondie en dessous — une lettre ne s allume qu une fois gagnee. Tout
   s allume quand l ordre est atteint, jamais avant : la derniere lettre
   est celle du geste qui finit. Les espaces ne comptent pas, ce sont
   des trous dans le verre. */
export function lettresAllumees(titre: string, fraction: number): number {
  const n = [...titre].filter((c) => /\S/.test(c)).length;
  if (n === 0) return 0;
  if (fraction >= 1) return n;
  return Math.min(n - 1, Math.floor(n * Math.max(0, fraction)));
}

/* L ARDOISE. Des batons par paquets de cinq — quatre traits, le
   cinquieme en travers — comme on compte a la craie. */
export function paquetsDeBatons(n: number): number[] {
  const paquets: number[] = [];
  for (let reste = Math.max(0, Math.floor(n)); reste > 0; reste -= 5) paquets.push(Math.min(5, reste));
  return paquets;
}

export interface Perforation {
  trous: number;
  perces: number;
  colonnes: number;
  rangees: number;
  unitesParTrou: number;
}

/* LA POINTEUSE. Les trous d une carte : un par unite jusqu a vingt-cinq,
   en rangees de cinq. Au-dela, chaque trou vaut plusieurs unites, pour
   que la carte garde sa taille — et un trou ne se perce qu entier. */
export function perforation(progres: number, cible: number, maximum = 25): Perforation {
  const c = Math.max(1, Math.floor(cible));
  const unitesParTrou = Math.ceil(c / maximum);
  const trous = Math.ceil(c / unitesParTrou);
  const colonnes = Math.min(5, trous);
  return {
    trous,
    perces: Math.min(trous, Math.floor(Math.max(0, progres) / unitesParTrou)),
    colonnes,
    rangees: Math.ceil(trous / colonnes),
    unitesParTrou,
  };
}
