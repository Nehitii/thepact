/* ═══════════════════════════════════════════════════════════════
   LES PRÉFÉRENCES LOCALES, DÉCLARÉES UNE FOIS

   Vingt réglages de lecture vivent dans le navigateur : quelle vue du
   calendrier, quel fond de la page de concentration, quelle forme pour
   la wishlist, quel tri, quelle mesure de progression. Aucun ne mérite
   une colonne en base — ils changent d'un écran à l'autre et ne
   suivent pas l'utilisateur d'un appareil au suivant.

   Ils étaient déclarés dans quinze fichiers, chacun sa constante. Rien
   ne les recensait, donc rien ne pouvait les remettre à zéro : une
   application coincée dans un état bizarre n'avait pas de porte de
   sortie autre que vider les données du site — ce qui déconnecte.

   CETTE LISTE EST LA SOURCE, PAS UNE COPIE. Les quinze fichiers
   l'importent. Sans quoi elle aurait dérivé, comme les catégories de
   tâche l'avaient fait quatre fois et les natures deux.
   ═══════════════════════════════════════════════════════════════ */

import "./renommageLocal";

/* L IMPORT DÉPLACE LES CLÉS DE L ANCIEN NOM VERS LE NOUVEAU.
   Voir renommageLocal.ts. Il est ici en plus de main.tsx : tout module
   qui touche à une préférence passe par ce fichier, donc le
   déplacement a lieu même si l ordre des imports change ailleurs. */

export const PREF = {
  /* ── Vues, tris, mises en page ── */
  /* PLUS ECRITE : le calendrier ouvre toujours sur le mois. La cle reste
     dans cette liste pour que la remise a zero nettoie la valeur laissee
     par les visites precedentes. */
  CALENDRIER_VUE: "overwrite.calendar.vue",
  ECHEANCES_VUE: "overwrite.echeances.vue",
  MONITORING_VUE: "overwrite.monitoring.vue",
  ORDRES_REPLIES: "overwrite.ordres.replies",
  MIA_LARGEUR: "overwrite.mia.largeur",
  MIA_ABSENCES: "overwrite.mia.absences",
  /* ── Ce qui flotte au-dessus de toutes les pages ── */
  /* BARRE_FLOTTANTE et BARRE_POSITION ont ete retirees avec la barre
     ⌘K flottante. Les valeurs deja ecrites chez les gens restent dans
     leur stockage : les effacer demanderait un passage de nettoyage
     pour deux clefs mortes qui ne genent personne. */
  MIA_VIGNETTE: "overwrite.mia.vignette",
  MIA_PASSAGE: "overwrite.mia.passage",
  TODO_VUE: "overwrite.todo.vue",
  WISHLIST_VUE: "overwrite.wishlist.vue",
  WISHLIST_AFFICHAGE: "overwrite.wishlist.affichage",
  REGISTRE_GROUPE: "overwrite.registre.groupe",
  REGISTRE_CONSTELLATIONS: "overwrite.registre.constellations",
  DOSSIER_TRI: "overwrite.groupe.tri",
  ANALYTICS_ETAT: "pacte:analytics:state",
  OBJECTIFS_FILTRES: "goals-page-settings",
  HUB_MESURE: "overwrite.hub.mesureProgression",
  JOURNAL_LUMIERE: "overwrite.journal.lumiere",
  JOURNAL_CORRECTEUR: "overwrite.journal.correcteur",
  JOURNAL_RAIL: "overwrite.journal.rail",

  /* ── Ambiance ── */
  FOCUS_FOND: "overwrite.focus.fond",
  SOUFFLE_SON: "overwrite.souffle.son",

  /* ── CE QUI N'EST PAS DE LA MISE EN PAGE ──
     Recensé ici pour que l'inventaire soit complet, mais ABSENT de la
     liste effaçable plus bas. Voir la note qui suit. */
  FOCUS_CONFIG: "overwrite.focus.config",
  FOCUS_LIEN: "overwrite.focus.lien",
  FOCUS_MEDIA: "overwrite.focus.media",
} as const;

/* ═══ CE QUE « REMETTRE À ZÉRO » EMPORTE ═══════════════════════════

   Dix-sept clés : des vues, des tris, des mises en page, deux
   ambiances. Tout ce qui décrit COMMENT l'application se montre.

   Trois clés recensées plus haut en sont exclues, et deux autres ne
   figurent nulle part dans ce fichier. Ce ne sont pas des oublis :

     FOCUS_CONFIG   les durées de travail et de pause. Un réglage, pas
                    une mise en page — les ramener à 25/5/15 sous
                    l'étiquette « préférences d'affichage » surprendrait.
     FOCUS_LIEN     l'objectif ou la tâche attachés à la séance. Une
                    sélection : ce sur quoi on travaille, pas comment
                    on le regarde.
     FOCUS_MEDIA    un lien collé à la main, par utilisateur. Du
                    contenu saisi ; l'effacer oblige à le retrouver.

     overwrite.focus.session une séance EN COURS, avec son minuteur.
     journal-draft-<id>      un brouillon d'entrée non enregistré.
     pact.language           la langue — un vrai réglage, miroir de
                             profiles.language ; l'effacer ferait
                             repeindre l'écran dans la langue par
                             défaut le temps que la base réponde.

   LA LISTE ÉCHOUE DU BON CÔTÉ. Balayer par préfixe — tout ce qui
   commence par « overwrite. » — emporterait la séance en cours, le lien
   collé et les brouillons, qui portent le même préfixe. Une liste
   explicite oublie parfois une préférence ; un préfixe efface parfois
   du travail.
   ═══════════════════════════════════════════════════════════════ */

const NON_EFFACABLES: readonly string[] = [PREF.FOCUS_CONFIG, PREF.FOCUS_LIEN, PREF.FOCUS_MEDIA];

export const PREFERENCES_EFFACABLES: readonly string[] = Object.values(PREF).filter(
  (c) => !NON_EFFACABLES.includes(c),
);

/**
 * Oublie les préférences d'affichage.
 *
 * Renvoie le nombre de clés réellement trouvées et effacées — pas la
 * taille de la liste : annoncer « dix-sept réglages remis à zéro » à
 * quelqu'un qui n'en avait jamais touché un seul serait faux.
 */
export function oublierLesPreferences(): number {
  let effacees = 0;
  for (const cle of PREFERENCES_EFFACABLES) {
    try {
      if (localStorage.getItem(cle) !== null) {
        localStorage.removeItem(cle);
        effacees++;
      }
    } catch {
      /* stockage indisponible : navigation privée, quota, politique */
    }
  }
  return effacees;
}

/** Combien de préférences sont actuellement posées. */
export function preferencesPosees(): number {
  try {
    return PREFERENCES_EFFACABLES.filter((c) => localStorage.getItem(c) !== null).length;
  } catch {
    return 0;
  }
}
