/* LE STATUT QU UN GESTE ECRIT.
 *
 * Mettre en pause, reprendre, archiver, defaire : quatre gestes qui ne
 * font qu une chose, poser un statut. Le choix se prenait au milieu de
 * trois gestionnaires quasi identiques, ou personne ne pouvait le
 * relire — et il n y a pas UNE regle mais deux, qui ne se ressemblent
 * qu a moitie.
 */
import type { Tables } from "@/socle/supabase/types";

/* Le type complet de la colonne. Il est redeclare ici plutot
   qu importe du crochet `useGoalDetail` : la logique ne remonte pas
   vers les crochets, et les deux alias sont le meme type. */
export type Statut = NonNullable<Tables<"goals">["status"]>;

/** Ce qu un avancement dicte, quand il a le droit de tout dire. */
export type StatutDeduit = "fully_completed" | "in_progress" | "not_started";

/* UN COMPTE DE TENUS DONNE UN STATUT — c est la regle des habitudes,
   appliquee par `etatDeLHabitude` avec ses trois issues. Elle est ici
   pour que la reprise, qui n en applique que deux, se lise a cote
   d elle plutot qu ailleurs.

   LA SIGNATURE DIT LES DEUX CAS. Sans elle, la reprise devrait ecarter
   « acheve » APRES coup, par une branche que rien ne peut atteindre :
   du code mort qu aucun balayage ne saurait distinguer d un trou dans
   les tests. Ici c est le type qui le sait, et il n y a rien a
   executer pour s en assurer. */
export function statutDUnAvancement(tenus: number, acheve: false): "in_progress" | "not_started";
export function statutDUnAvancement(tenus: number, acheve: boolean): StatutDeduit;
export function statutDUnAvancement(tenus: number, acheve: boolean): StatutDeduit {
  return acheve ? "fully_completed" : tenus > 0 ? "in_progress" : "not_started";
}

/* ═══════════════════════════════════════════════════════════════
   REPRENDRE NE REND JAMAIS L HONNEUR.

   La reprise appelle la meme regle avec « acheve » a FAUX, toujours :
   elle ne sait dire que « en cours » ou « non commence ». Un objectif
   dont toutes les etapes sont tenues revient donc « en cours ».

   CE N EST PAS UN DEFAUT VISIBLE, ET CE N EST PAS PAR HASARD : le
   bouton « Reprendre » ne parait que pour un objectif EN PAUSE
   (DossierBandeau), et un objectif honore ne peut pas etre mis en
   pause — « arretable » exclut `fully_completed`. La branche manquante
   est donc hors d atteinte depuis l ecran.

   Elle l est PAR UNE CONDITION ECRITE AILLEURS, dans un autre fichier,
   sur un autre ecran. Le jour ou « arretable » changerait d avis, la
   reprise retrograderait un objectif honore en « en cours » sans que
   rien ne le dise. Le « false » ci-dessous est donc ecrit en clair,
   pas sous-entendu.
   ═══════════════════════════════════════════════════════════════ */
export function statutDeLaReprise(tenus: number | null | undefined): "in_progress" | "not_started" {
  return statutDUnAvancement(tenus ?? 0, false);
}

/* ═══════════════════════════════════════════════════════════════
   CE QU ON DEFAIT QUAND ON NE SAIT PLUS D OU L ON VIENT.

   Chaque geste de statut propose de revenir en arriere. La cible du
   retour est le statut d avant — et la colonne `status` est NULLABLE.
   Deux reponses coexistaient a la meme question :

     la pause et l archivage n offrent PAS de retour quand le statut
     d avant est inconnu ; la reprise en offre un, qui pose
     « non commence ». Le meme trou, deux issues opposees.

   Cette fonction ne tranche pas — elle nomme la reponse de la reprise,
   et laisse les deux autres passer « undefined », ce qui est leur
   reponse a elles. Trancher changerait ce que montre le bandeau.

   MESURE, LE 30/08/2026 : aucune des 38 lignes du compte ne porte de
   statut nul. Ce repli n est donc pas atteint aujourd hui — mais la
   colonne l autorise, ce n est pas du code mort.

   ET IL NE TRADUIT PAS. L enum `goal_status` porte NEUF etiquettes,
   l application en ecrit six : `active`, `completed` et `cancelled`
   sont d avant, et le DEFAUT DE LA COLONNE est `active`. Une insertion
   qui omettrait le statut donnerait un objectif que ni la reprise ni
   le bandeau ne savent presenter — seule `getGoalStatusIcon` les
   reconnait encore, pour leur donner une icone. Aucune des 38 lignes
   n en porte, mesure le meme jour. Constate, non corrige : retirer les
   etiquettes ou changer le defaut demande une migration, pas une
   coupe.
   ═══════════════════════════════════════════════════════════════ */
export function statutDuRetour(precedent: Statut | null | undefined): Statut {
  return precedent ?? "not_started";
}
