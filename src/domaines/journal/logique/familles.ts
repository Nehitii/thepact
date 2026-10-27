/* ═══════════════════════════════════════════════════════════════
   L ORIENTATION DES QUESTIONS

   Quinze questions tournaient, heritees d une application de
   developpement personnel : gratitude, stoic, cbt, visualization,
   reflection. La rotation etant hash(jour, utilisateur) % 15, la meme
   revenait tous les quinze jours.

   Elles sont cent soixante-neuf par langue, en huit familles, et
   l utilisateur choisit lesquelles il veut. Aucune selection vaut
   toutes les familles : on ne demande pas de configurer avant de
   pouvoir s en servir.

   LE REGISTRE EST REFLEXIF, PAS DIRECTIF. Une question de journal ne
   demande jamais ce qu on va faire — elle demande ce qu on voit. C est
   vrai jusque dans la famille « pacte », qui parle des objectifs de
   l utilisateur sans jamais lui suggerer quoi en faire.
   ═══════════════════════════════════════════════════════════════ */

export interface FamilleDeQuestions {
  /** Correspond a journal_prompts.category. */
  cle: string;
  /** Cle i18n du nom affiche. */
  nom: string;
  /** Cle i18n de la ligne qui dit de quoi la famille parle. */
  quoi: string;
}

/* Rangees du plus grave au plus leger : c est l ordre dans lequel elles
   s affichent, et il n est pas neutre. */
export const FAMILLES: readonly FamilleDeQuestions[] = [
  { cle: "derniers_mots", nom: "journal.familles.derniersMots.nom", quoi: "journal.familles.derniersMots.quoi" },
  { cle: "le_tu", nom: "journal.familles.leTu.nom", quoi: "journal.familles.leTu.quoi" },
  { cle: "les_autres", nom: "journal.familles.lesAutres.nom", quoi: "journal.familles.lesAutres.quoi" },
  { cle: "ce_que_tu_crois", nom: "journal.familles.ceQueTuCrois.nom", quoi: "journal.familles.ceQueTuCrois.quoi" },
  { cle: "le_temps", nom: "journal.familles.leTemps.nom", quoi: "journal.familles.leTemps.quoi" },
  { cle: "le_pacte", nom: "journal.familles.lePacte.nom", quoi: "journal.familles.lePacte.quoi" },
  { cle: "sensible", nom: "journal.familles.sensible.nom", quoi: "journal.familles.sensible.quoi" },
  { cle: "l_ordinaire", nom: "journal.familles.lOrdinaire.nom", quoi: "journal.familles.lOrdinaire.quoi" },
];

export const CLES_DE_FAMILLE: readonly string[] = FAMILLES.map((f) => f.cle);

/**
 * Les familles reellement retenues pour tirer la question du jour.
 *
 * Rien de choisi vaut TOUT choisi. Une liste vide ne doit jamais
 * produire un journal sans question : ce serait punir l utilisateur
 * d avoir tout decoche.
 */
export function famillesRetenues(choix: string[] | null | undefined): string[] {
  const valides = (choix ?? []).filter((c) => CLES_DE_FAMILLE.includes(c));
  return valides.length > 0 ? valides : [...CLES_DE_FAMILLE];
}

/** Toutes les familles sont-elles actives ? Sert a l affichage du reglage. */
export const toutesRetenues = (choix: string[] | null | undefined): boolean =>
  famillesRetenues(choix).length === CLES_DE_FAMILLE.length;
