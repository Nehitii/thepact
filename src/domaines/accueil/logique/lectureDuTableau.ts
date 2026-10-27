import {
  ORDRE_DES_PALIERS, NOMS_DES_PALIERS, TEINTES_DES_PALIERS,
  type Difficulte, type ObjectifDuScenario,
} from "./scenarioDuTableau";

/* CE QUE LES TROIS REFONTES LISENT DU PACTE, CALCULE UNE FOIS.
 *
 * Les memes regles que le tableau de bord actuel (voir
 * « tableauDeBord.ts ») : une habitude n a pas d etapes, un jour n est
 * ecoule que lorsqu il l est. Trois structures qui calculeraient
 * chacune leurs chiffres finiraient par se contredire — et l on
 * comparerait des erreurs au lieu de compositions. */

export interface Palier {
  cle: Difficulte;
  nom: string;
  teinte: string;
  etapes: number;
  faites: number;
  objectifs: number;
  tenus: number;
}

export interface Lecture {
  jour: number;
  jours: number;
  restants: number;
  pctTemps: number;
  objectifs: { total: number; tenus: number; ouverts: number; enAttente: number; pct: number };
  etapes: { total: number; faites: number; pct: number };
  habitudes: { jours: number; coches: number };
  paliers: Palier[];
  /** Points d avance (+) ou de retard (-) des objectifs tenus sur le temps ecoule. */
  ecart: number;
  palierLePlusLourd: Palier | null;
}

const JOUR = 86_400_000;

export function lireLeTableau(
  objectifs: readonly ObjectifDuScenario[],
  pacte: { debut: Date; fin: Date },
  maintenant: Date,
): Lecture {
  const jours = Math.round((pacte.fin.getTime() - pacte.debut.getTime()) / JOUR);
  const jour = Math.max(0, Math.min(jours, Math.floor((maintenant.getTime() - pacte.debut.getTime()) / JOUR)));
  const pctTemps = jours > 0 ? (jour / jours) * 100 : 0;

  const avecEtapes = objectifs.filter((o) => !o.habitude);
  const tenus = objectifs.filter((o) => o.statut === "fully_completed").length;
  const ouverts = objectifs.filter((o) => o.statut === "in_progress").length;
  const enAttente = objectifs.filter((o) => o.statut === "not_started").length;
  const totalEtapes = avecEtapes.reduce((s, o) => s + o.etapes, 0);
  const faites = avecEtapes.reduce((s, o) => s + o.faites, 0);
  const habitudes = objectifs.reduce(
    (s, o) => (o.habitude ? { jours: s.jours + o.habitude.jours, coches: s.coches + o.habitude.coches } : s),
    { jours: 0, coches: 0 },
  );

  const paliers = ORDRE_DES_PALIERS.map((cle) => {
    const du = objectifs.filter((o) => o.difficulte === cle);
    const etapes = du.filter((o) => !o.habitude).reduce((s, o) => s + o.etapes, 0);
    return {
      cle,
      nom: NOMS_DES_PALIERS[cle],
      teinte: TEINTES_DES_PALIERS[cle],
      etapes,
      faites: du.filter((o) => !o.habitude).reduce((s, o) => s + o.faites, 0),
      objectifs: du.length,
      tenus: du.filter((o) => o.statut === "fully_completed").length,
    };
  }).filter((p) => p.etapes > 0);

  const pctObjectifs = objectifs.length > 0 ? (tenus / objectifs.length) * 100 : 0;
  const palierLePlusLourd = paliers.reduce<Palier | null>(
    (a, b) => (!a || b.etapes - b.faites > a.etapes - a.faites ? b : a),
    null,
  );

  return {
    jour,
    jours,
    restants: jours - jour,
    pctTemps,
    objectifs: { total: objectifs.length, tenus, ouverts, enAttente, pct: pctObjectifs },
    etapes: { total: totalEtapes, faites, pct: totalEtapes > 0 ? (faites / totalEtapes) * 100 : 0 },
    habitudes,
    paliers,
    ecart: Math.round(pctObjectifs - pctTemps),
    palierLePlusLourd,
  };
}

/* ── Les mots du temps, en francais ─────────────────────────────── */

/** « 1 057 », avec l espace fine insecable des milliers. */
export const nombre = (n: number) => Math.round(n).toLocaleString("fr-FR");

/** « 19:42 » */
export const heure = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** « vendredi 26 septembre » ; l annee n apparait que si elle change.
 *  Le premier du mois s ecrit « 1er », comme on l ecrit a la main. */
export function dateLongue(d: Date, maintenant: Date): string {
  const annee = d.getFullYear() !== maintenant.getFullYear();
  const texte = d.toLocaleDateString("fr-FR", {
    weekday: annee ? undefined : "long",
    day: "numeric",
    month: "long",
    year: annee ? "numeric" : undefined,
  });
  return d.getDate() === 1 ? texte.replace(/(^|\s)1 /, (_, avant: string) => `${avant}1er `) : texte;
}

/** La date au bord d un axe de temps : « sam. 26 » dans les deux
 *  semaines, « 15 nov. » plus loin dans l annee, « avr. 2027 » au-dela.
 *  Un jour de semaine sans mois ne se lit qu a courte distance. */
export function dateCourte(d: Date, maintenant: Date): string {
  if (d.getFullYear() !== maintenant.getFullYear()) {
    return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
  }
  if ((d.getTime() - maintenant.getTime()) / JOUR < 14) {
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Ce qui reste avant une date : « 2 j 22 h », « 6 h 18 », « 12 min ». */
export function resteAvant(d: Date, maintenant: Date): string {
  const ms = Math.max(0, d.getTime() - maintenant.getTime());
  const j = Math.floor(ms / JOUR);
  const h = Math.floor((ms % JOUR) / 3_600_000);
  const min = Math.floor((ms % 3_600_000) / 60_000);
  if (j >= 2) return `${j} j ${h} h`;
  if (j === 1) return `1 j ${h} h`;
  if (h > 0) return `${h} h ${String(min).padStart(2, "0")}`;
  return `${min} min`;
}

/** Une distance dans le temps, a l echelle qui la dit le mieux :
 *  « 6 h 18 », « 3 jours », « 7 mois », « 3,2 ans ». */
export function dans(d: Date, maintenant: Date): string {
  const j = (d.getTime() - maintenant.getTime()) / JOUR;
  if (j < 2) return resteAvant(d, maintenant);
  if (j < 45) return `${Math.round(j)} jours`;
  if (j < 700) return `${Math.round(j / 30.4)} mois`;
  return `${(j / 365.25).toFixed(1).replace(".", ",")} ans`;
}

/** Une date du scenario : « 2026-09-30 » ou « 2026-09-26T18:00 », en heure locale. */
export function lireDate(iso: string): Date {
  const [jour, temps] = iso.split("T");
  const [a, m, j] = jour.split("-").map(Number);
  const [h, min] = (temps ?? "00:00").split(":").map(Number);
  return new Date(a, m - 1, j, h, min);
}
