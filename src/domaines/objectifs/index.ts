/**
 * LA PORTE DU DOMAINE OBJECTIFS.
 *
 * Soixante-six fichiers, dix-sept mille lignes : le domaine central de
 * l application. Sa porte en exporte onze.
 *
 *   usePact / fetchPact       le prechargement, la porte protegee,
 *       la barre neurale, l accueil — tout ce qui a besoin de savoir
 *       qu un pacte existe
 *   useGoals / fetchGoals     idem, plus le tirage de mission
 *   useSharedPacts            la porte protegee
 *   useEtapes / useGoalFilters  la quatrieme vue de la page Objectifs
 *   PactVisual                la banniere de l accueil
 *   getDifficultyLabel / getStatusLabel / getTagLabel   l Analytique
 *   Goal / Pact               les deux types que six domaines citent
 *
 * LES DEUX TYPES SONT LA RAISON POUR LAQUELLE CE DOMAINE VIENT AVANT LE
 * SOCLE. `Goal` et `Pact` etaient declares dans leurs hooks, et sept
 * fichiers de cinq autres domaines les importaient de la — la finance
 * pour compter les pieces, les souhaits pour la synchronisation, les
 * succes pour l experience, le social pour choisir un objectif a
 * partager. Chacune de ces fleches passe desormais par cette porte.
 *
 * `components/analytics/GoalContrats.tsx` N EST PAS ENTRE, malgre son
 * nom : il vit avec les trois autres composants d analytique, que le
 * plan n a pas encore ranges. Comme l administration, c est un domaine
 * qui apparait en chemin.
 *
 * `components/front/FrontListe.tsx` EST ENTRE, malgre son dossier : son
 * en-tete dit « la quatrieme vue de la page Goals », et son seul
 * lecteur est `GoalsList`. Un dossier nomme `front/` pour un seul
 * fichier n etait pas un module.
 */
export { usePact, fetchPact } from "./hooks/usePact";

/* LE SCEAU DU PACTE. Ses glyphes se deduisent du nom et des valeurs :
   meme pacte, meme dessin, partout. Il vit ici et non dans le rite
   qui le fait naitre — la carte d identite, le pantheon et la guilde
   n ont aucune raison d importer quoi que ce soit d un ecran
   d inscription qu ils ne montrent jamais.

   « VERSION_ALPHABET » sort aussi : c est ce que le rite ecrit dans
   « pacts.sigil_version » au moment de sceller. */
/* LA ROSACE — le sceau tel qu il se montre. Le tableau de bord y met
   le rond de son heros, le rite l y forge. Nulle part ailleurs. */
export { RosaceDuPacte } from "./composants/RosaceDuPacte";
export { rosaceDuPacte, BRANCHES_POSSIBLES } from "./logique/rosace";
export { useValeursDuPacte } from "./hooks/useValeursDuPacte";
export type { Rosace, BrancheDeLaRosace, MedaillonDeLaRosace } from "./logique/rosace";
export {
  sigilDuPacte, normaliser, empreinte, echantillonner,
  ALPHABET, VERSION_ALPHABET, TRAITS_MAX,
  type Sigil, type TraitDuSigil, type AncreDuSigil,
} from "./logique/sigil";
/* COMMENT LE PACTE ECRIT SON NOM. Deux colonnes de « pacts » : le
   bandeau les rend, « Mon pacte » les choisit, et les deux lisaient
   chacun sa propre copie de la table. */
export {
  POLICES_DU_TITRE, EFFETS_DU_TITRE, POLICE_PAR_DEFAUT,
  familleDeLaPolice, styleDeLEffet,
  type PoliceDuTitre, type EffetDuTitre,
} from "./logique/typographieDuPacte";
export type { Pact } from "./hooks/usePact";
export { useGoals, fetchGoals } from "./hooks/useGoals";
export type { Goal } from "./hooks/useGoals";
export { useSharedPacts } from "./hooks/useSharedPacts";
export { useEtapes } from "./hooks/useEtapes";
export { useGoalFilters } from "./hooks/useGoalFilters";
export { PactVisual } from "./composants/PactVisual";
export { IdentiteDuPacte } from "./composants/IdentiteDuPacte";
export { getDifficultyLabel, getStatusLabel, getTagLabel } from "./logique/goalConstants";

/* QUATRE PIECES DE PLUS, TROUVEES PAR LA GARDE APRES COUP.
   La porte avait ete ecrite sur le releve d AVANT le deplacement, qui
   ne voyait pas ces quatre-la : les trois autres domaines qui les
   appellent n existaient pas encore quand le releve a ete fait.

   Le profil remet le pacte a zero et le modifie ; le social laisse
   choisir un objectif a partager et en fait une carte. */
export { useResetPact } from "./hooks/useResetPact";
export { usePactMutation } from "./hooks/usePactMutation";
export { useCarteObjectif, teinteDuPalier } from "./hooks/useCarteObjectif";
export { default as PactSelectorModal } from "./composants/PactSelectorModal";

/* LES PIECES CHIFFREES. La finance les lit pour compter ce que coute
   le pacte, et les souhaits les synchronisent en liste. La table est
   goal_cost_items : elles appartiennent a l objectif qui les porte. */
export {
  usePactCostItems,
  useAcquerirPieces,
  useCostItems,
  useSaveCostItems,
} from "./hooks/useCostItems";
export type { CostItem } from "./hooks/useCostItems";
