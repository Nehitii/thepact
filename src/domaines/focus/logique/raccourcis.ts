import { saisieEnCours } from "@/socle/outils/clavier";

/* LES TROIS TOUCHES D UNE SESSION EN COURS.
 *
 * Elles ne valent QUE minuteur en marche : le gestionnaire n est pose
 * qu a ce moment-la, et retire des l arret. Une barre d espace sur la
 * page au repos n a donc aucun effet, et c est voulu — la page se lit
 * aussi sans session.
 */
export type CommandeDuFocus = "basculer" | "passer" | "sortir";

/* Ce que la fonction lit d un evenement clavier. Le type complet
   demanderait un DOM ; celui-ci se construit a la main dans un test. */
export interface ToucheLue {
  code: string;
  key: string;
  shiftKey: boolean;
  target: EventTarget | null;
}

/* ═══════════════════════════════════════════════════════════════
   « MAJ + S » NE REGARDE PAS LES AUTRES MODIFICATEURS.

   La condition est `shiftKey && key === "s"`. Elle est donc vraie AUSSI
   pour Ctrl+Maj+S et Cmd+Maj+S — deux combinaisons que les navigateurs
   se reservent (capture d ecran sous Firefox, « enregistrer sous »
   ailleurs). Qui les presse pendant une session saute une phase et voit
   passer « phase suivante », sans avoir rien demande a l application.

   La barre d espace a le meme trou : `code === "Space"` est vraie avec
   Ctrl ou Cmd tenus.

   CONSTATE, NON CORRIGE : ajouter la garde changerait ce que font deux
   combinaisons de touches. Un test tient la situation telle qu elle est
   pour que la corriger se voie.
   ═══════════════════════════════════════════════════════════════ */
export function commandeDuFocus(e: ToucheLue): CommandeDuFocus | null {
  /* On ne vole pas les touches de quelqu un qui ecrit — la regle
     complete est dans socle/outils/clavier.ts, et elle n etait pas la
     meme ici que dans les trois autres raccourcis globaux. */
  if (saisieEnCours(e.target)) return null;

  if (e.code === "Space") return "basculer";
  if (e.shiftKey && e.key.toLowerCase() === "s") return "passer";
  if (e.key === "Escape") return "sortir";
  return null;
}
