/* L ETAT DU JOUR, DONNE AVANT QU ON LE DEMANDE.
 *
 * L ancien prompt ordonnait d appeler un outil AVANT TOUTE QUESTION
 * FACTUELLE. « Ou j en suis ? » coutait donc un tour d outil complet :
 * une generation pour decider d appeler, une requete, une generation
 * pour repondre. Ces quelques lignes, calculees en une salve de
 * requetes paralleles, repondent a la moitie des questions sans un
 * seul outil. Elles coutent une centaine de tokens et une trentaine de
 * millisecondes.
 *
 * CE MODULE N INTERROGE RIEN : il recoit les lignes deja lues et rend
 * le texte. Tout ce qui touche a Supabase reste dans `index.ts` ; tout
 * ce qui DECIDE est ici, et peut donc etre relu.
 *
 * CE TEXTE N EST PAS DE LA DECORATION : c est ce que le modele recopie
 * quand on lui demande ou il en est. Un nombre faux ici ressort mot
 * pour mot dans la reponse, avec l aplomb d une donnee fraiche.
 *
 * ═══════════════════════════════════════════════════════════════
 * LE SERVEUR TOURNE EN UTC, L UTILISATEUR NON.
 *
 * Un rendez-vous saisi pour le 27 est enregistre a minuit heure locale
 * — soit 22 h UTC le 26. Date avec un simple `toLocaleDateString()`,
 * il ressortait « 26/08 », et M.I.A annoncait au matin du 26 un
 * rendez-vous qui « attend aujourd hui ». Ce n etait pas un cas limite
 * de minuit : TOUTE echeance datee se decalait d un jour, a toute
 * heure, pour tout utilisateur a l est de Greenwich.
 *
 * La colonne `profiles.timezone` existait deja — et valait « UTC »
 * pour tout le monde, personne ne l ayant jamais renseignee. Le fuseau
 * vient donc du navigateur, avec la question. La colonne sert de
 * second recours.
 * ═══════════════════════════════════════════════════════════════
 */
import { MS_PAR_JOUR } from "./bornes.ts";
import {
  brigadeDe, butsDesPactes, comptesDesObjectifs, dureeDuPacte,
  etapesRestantes, minutesDeFocus, pacteActif, plusGrosRestes, primeDesOrdres,
  type ObjectifLu, type OrdreLu, type PacteLu,
} from "./etatDuPacte.ts";

/* ── LES DATES, DANS LE FUSEAU DE QUELQU UN ──────────────────── */

/* « en-CA » N EST PAS UN CHOIX DE LANGUE, C EST UN CHOIX DE FORMAT :
   c est la seule locale courante qui ecrive AAAA-MM-JJ, donc la seule
   qui se compare avec `===` sans passer par un decoupage. La zone, elle,
   fait tout le travail — c est elle qui empeche un rendez-vous du 27
   saisi a minuit heure locale de ressortir « 26 ». */
export function jourCivil(quand: Date, zone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(quand);
}

export function dateCourte(quand: Date, zone: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: zone, day: "2-digit", month: "2-digit", year: "numeric",
  }).format(quand);
}

export function dateLongue(quand: Date, zone: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: zone, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(quand);
}

/* DEMAIN EST CALCULE EN AJOUTANT VINGT-QUATRE HEURES DE
 * MILLISECONDES, ce qui n est pas le lendemain civil.
 *
 * Deux jours par an, les deux different : le jour du passage a l heure
 * d hiver dure vingt-cinq heures, celui du passage a l heure d ete en
 * dure vingt-trois. Le test dit exactement quand, et ce que l ecart
 * produit. */
export function jourSuivant(maintenant: Date, zone: string): string {
  return jourCivil(new Date(maintenant.getTime() + MS_PAR_JOUR), zone);
}

/* ON DIT « AUJOURD HUI » ET « DEMAIN », PAS UNE DATE : c est ce qu on
   dit en parlant, et c est ce que le modele recopiera. */
export function quandDire(echeance: Date, maintenant: Date, zone: string): string {
  const j = jourCivil(echeance, zone);
  if (j === jourCivil(maintenant, zone)) return "aujourd'hui";
  if (j === jourSuivant(maintenant, zone)) return "demain";
  return dateCourte(echeance, zone);
}

/* ── LES TACHES ──────────────────────────────────────────────── */

export interface TacheLue {
  name?: string | null;
  deadline?: string | null;
}

/** Quatre echeances, pas plus : au-dela, on decrit une liste. */
export const ECHEANCES_MONTREES = 4;

/* LES TACHES SANS ECHEANCE SORTENT DE LA LISTE, PAS DU COMPTE. Elles
   restent dans « Taches ouvertes : N » ; seule la liste des prochaines
   les ignore, faute de date a leur donner.
 *
 * LE PREDICAT EST TYPE, ET CE N EST PAS UN ORNEMENT : sans lui,
 * TypeScript ne relie pas ce test au `.map()` qui suit, et
 * `new Date(null)` rendrait une date invalide sans un mot. */
export function prochainesEcheances(
  taches: TacheLue[],
  maintenant: Date,
  zone: string,
  combien = ECHEANCES_MONTREES,
): string[] {
  return taches
    .filter((t): t is TacheLue & { deadline: string } => Boolean(t.deadline))
    /* Les echeances sont des chaines ISO : les comparer comme du texte
       les range comme des dates, sans en construire aucune. */
    .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
    .slice(0, combien)
    .map((t) => `${t.name} (${quandDire(new Date(t.deadline), maintenant, zone)})`);
}

/* ── LE TEXTE ENTIER ─────────────────────────────────────────── */

export interface DonneesDuJour {
  maintenant: Date;
  zone: string;
  nom?: string | null;
  actifId?: string | null;
  pactes: PacteLu[];
  objectifs: ObjectifLu[];
  ordres: Array<OrdreLu & { title?: string | null; progress?: number | null; target?: number | null }>;
  focus: Array<{ duration_minutes?: number | null }>;
  /* CE MODULE COMPTE CE QU IL RECOIT. L appelant lui en donne au plus
     quarante (`.limit(40)` sur `todo_tasks`) : au-dela, la ligne
     annonce 40 taches ouvertes et M.I.A le repete comme un fait. */
  taches: TacheLue[];
  solde?: number | null;
}

/* CHAQUE LIGNE EST UNE PHRASE QUE M.I.A PEUT RECOPIER TELLE QUELLE.
 * D ou l ordre : le jour, puis qui parle, puis le pacte, puis ce qui
 * reste a faire, puis ce qui presse.
 *
 * ON DONNE LES TOTAUX DEJA FAITS, PAS LEURS INGREDIENTS. Premier
 * essai, l etat annoncait « 14 en cours, 11 non commences, etapes
 * 142/423 » et laissait le modele en deduire ce qu on lui demandait.
 * Reponse obtenue : « 48 etapes sur 11 objectifs en cours, 276 au
 * total ». Trois chiffres, trois faux — la verite etait 59 sur 14, et
 * 281 au total. Un modele ne somme pas quatorze lignes de tete. */
export function lignesDeLEtat(d: DonneesDuJour): string[] {
  const { maintenant, zone } = d;

  const lignes: string[] = [
    `ÉTAT DU JOUR — ${dateLongue(maintenant, zone)}.`,
    `Cette donnée est fraîche : n'appelle pas d'outil pour la retrouver.`,
  ];

  /* Sans le nom, M.I.A repondait « ton nom est Inconnu car je n ai pas
     cette donnee » a qui lui demandait comment il s appelait. */
  if (d.nom) lignes.push(`Ton interlocuteur s appelle ${d.nom}.`);

  const pacte = pacteActif(d.actifId ?? null, d.pactes);
  if (pacte) {
    const debut = pacte.project_start_date ? new Date(pacte.project_start_date).getTime() : null;
    const fin = pacte.project_end_date ? new Date(pacte.project_end_date).getTime() : null;
    const duree = dureeDuPacte(debut, fin, maintenant.getTime());
    if (duree) {
      lignes.push(
        `Pacte actif : ${pacte.name} — jour ${duree.ecoule} / ${duree.total}, ` +
          `${duree.reste} jours restants, fin le ${dateCourte(new Date(fin as number), zone)}.`,
      );
    } else {
      lignes.push(`Pacte actif : ${pacte.name} (pas de dates posées).`);
    }
    if (d.pactes.length > 1) {
      lignes.push(`Autres pactes : ${d.pactes.filter((p) => p.id !== pacte.id).map((p) => p.name).join(", ")}.`);
    }
  } else {
    lignes.push("Aucun pacte enregistré.");
  }

  const buts = butsDesPactes(d.objectifs, d.pactes);
  if (buts.length) {
    const comptes = comptesDesObjectifs(buts);
    lignes.push(
      `Objectifs : ${comptes.enCours} en cours (${etapesRestantes(buts, "in_progress")} étapes restantes), ` +
        `${comptes.aVenir} non commencés (${etapesRestantes(buts, "not_started")} étapes restantes), ` +
        `${comptes.finis} terminés.`,
    );
    lignes.push(
      `Étapes, toutes catégories : ${comptes.faites} faites sur ${comptes.etapes}, ` +
        `${comptes.restantes} restantes.`,
    );

    const plusGros = plusGrosRestes(buts);
    if (plusGros.length) {
      lignes.push(`Plus gros restes en cours : ${plusGros.map((g) => `${g.nom} (${g.reste})`).join(", ")}.`);
    }
    const brigade = brigadeDe(buts);
    if (brigade.length) lignes.push(`Brigade (objectifs épinglés) : ${brigade.join(", ")}.`);
  }

  if (d.ordres.length) {
    const { acquise, totale: prime } = primeDesOrdres(d.ordres);
    lignes.push(
      `Ordres du jour : ` +
        d.ordres.map((q) => `${q.title} ${q.progress}/${q.target}`).join(" · ") +
        ` — prime ${acquise}/${prime} bonds.`,
    );
  }

  const minutes = minutesDeFocus(d.focus);
  lignes.push(`Focus aujourd'hui : ${minutes} minute${minutes > 1 ? "s" : ""}.`);

  if (d.taches.length) {
    const prochaines = prochainesEcheances(d.taches, maintenant, zone);
    lignes.push(
      `Tâches ouvertes : ${d.taches.length}` +
        (prochaines.length ? `. Prochaines échéances : ${prochaines.join(", ")}.` : "."),
    );
  } else {
    lignes.push("Tâches ouvertes : aucune.");
  }

  if (d.solde != null) lignes.push(`Solde : ${d.solde} bonds.`);

  return lignes;
}
