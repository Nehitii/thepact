import { dateCivileDepuisTexte } from "@/socle/outils/jour";

/* LE COMPTE A REBOURS DU PACTE, LU POUR ETRE DESSINE.
 *
 * Les refontes du panneau lisent toutes le temps de la meme facon : la
 * part ecoulee entre les deux bornes, ce qui reste, le chiffre a mettre
 * en grand et l etat. Cette lecture vit ici, une fois, et se teste.
 *
 * LES BORNES SONT DES JOURS CIVILS. Le premier jour commence a minuit
 * chez le lecteur ; le TERME EST LA FIN DU DERNIER JOUR. L ancien panneau
 * comptait jusqu au 30 juin a minuit UTC — le matin du 30 : un pacte qui
 * court « jusqu au 30 juin » se disait termine toute sa derniere
 * journee. Une colonne qui porte deja une heure est un instant, et
 * reste tel quel.
 *
 * LE GROS CHIFFRE CHANGE D UNITE quand les jours ne disent plus rien :
 * des jours jusqu a deux jours, puis des heures jusqu a deux heures,
 * puis des minutes — « 0 jour » le dernier matin serait un cadran
 * arrete.
 *
 * L ETAT SUIT LA PART QUI RESTE, aux seuils de l ancien panneau : plus
 * des trois quarts, nominal ; plus d un quart, attention ; en dessous,
 * critique. Avant le premier jour, a venir ; au terme, termine. */

export type EtatDuCompte = "a-venir" | "nominal" | "attention" | "critique" | "termine";
export type UniteDuCompte = "jours" | "heures" | "minutes";

export interface LectureDuCompte {
  /** Minuit, au premier jour. */
  debut: number;
  /** Minuit, apres le dernier jour. */
  fin: number;
  /** La part ecoulee, de zero a un. */
  part: number;
  resteMs: number;
  /** Ce qui reste avant le premier jour, pour un pacte a venir. */
  avantLeDebutMs: number;
  joursTotal: number;
  joursEcoules: number;
  gros: { valeur: number; unite: UniteDuCompte; mot: string };
  etat: EtatDuCompte;
}

const JOUR = 86_400_000;
const HEURE = 3_600_000;
const MINUTE = 60_000;

const estUnJourNu = (texte: string) => /^\d{4}-\d{2}-\d{2}$/.test(texte.trim());

/** Minuit, au premier jour — ou l instant tel quel s il porte une heure. */
export function instantDuDebut(texte: string): number | null {
  const d = estUnJourNu(texte) ? dateCivileDepuisTexte(texte) : new Date(texte);
  const ms = d?.getTime();
  return ms === undefined || Number.isNaN(ms) ? null : ms;
}

/** Minuit, apres le dernier jour — ou l instant tel quel s il porte une heure. */
export function instantDeLaFin(texte: string): number | null {
  if (!estUnJourNu(texte)) {
    const ms = new Date(texte).getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  const d = dateCivileDepuisTexte(texte);
  if (!d) return null;
  d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** Le chiffre a mettre en grand, et son mot — accorde. */
export function grosChiffre(resteMs: number): LectureDuCompte["gros"] {
  if (resteMs >= 2 * JOUR) return { valeur: Math.ceil(resteMs / JOUR), unite: "jours", mot: "jours restants" };
  if (resteMs >= 2 * HEURE) return { valeur: Math.floor(resteMs / HEURE), unite: "heures", mot: "heures restantes" };
  const minutes = Math.floor(resteMs / MINUTE);
  return { valeur: minutes, unite: "minutes", mot: minutes >= 2 ? "minutes restantes" : "minute restante" };
}

export function etatDuCompte(part: number, resteMs: number, avantLeDebutMs: number): EtatDuCompte {
  if (resteMs <= 0) return "termine";
  if (avantLeDebutMs > 0) return "a-venir";
  const reste = 1 - part;
  return reste > 0.75 ? "nominal" : reste > 0.25 ? "attention" : "critique";
}

/** La lecture d un instant ; rien sans date de fin — le panneau ne se montre pas. */
export function lireLeCompte(
  debutTexte: string | null | undefined, finTexte: string | null | undefined, maintenant: number,
): LectureDuCompte | null {
  if (!finTexte) return null;
  const fin = instantDeLaFin(finTexte);
  if (fin === null) return null;
  /* Sans debut, le compte part d aujourd hui : c est ce que faisait le
     panneau d avant, et un pacte sans debut n a rien d ecoule. */
  const debut = Math.min((debutTexte ? instantDuDebut(debutTexte) : null) ?? maintenant, fin);
  const total = fin - debut;
  const part = total > 0 ? Math.min(1, Math.max(0, (maintenant - debut) / total)) : 1;
  const resteMs = Math.max(0, fin - maintenant);
  const avantLeDebutMs = Math.max(0, debut - maintenant);
  return {
    debut,
    fin,
    part,
    resteMs,
    avantLeDebutMs,
    joursTotal: Math.round(total / JOUR),
    joursEcoules: Math.max(0, Math.floor((Math.min(maintenant, fin) - debut) / JOUR)),
    gros: grosChiffre(resteMs),
    etat: etatDuCompte(part, resteMs, avantLeDebutMs),
  };
}

/** La cadence de rafraichissement : la minute tant qu on compte en jours, la seconde a la fin. */
export const cadenceDuCompte = (resteMs: number): number => (resteMs > 2 * JOUR ? 60_000 : 1_000);
