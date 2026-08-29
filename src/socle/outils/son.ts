/* LE SON, VU D EN BAS.
 *
 * ═══════════════════════════════════════════════════════════════
 * POURQUOI CE FICHIER EXISTE.
 *
 * Quatre primitifs du systeme de design — le bouton, le dialogue,
 * l interrupteur, les onglets — jouent un clic discret. Ils allaient le
 * chercher dans `SoundContext`, c est-a-dire qu un composant de rang 2
 * appelait un contexte de rang 3. La garde des couches le signalait
 * depuis le debut du plan de masse, sous une tolerance qui disait
 * « arbitrage a rendre, pas un simple deplacement ».
 *
 * L ARBITRAGE, RENDU LE 29/08. On ne deplace pas `SoundContext` : c est
 * un contexte React, son rang est juste. C est la FLECHE qui est a
 * l envers. Un primitif ne doit pas savoir qu il existe un fournisseur ;
 * il doit pouvoir DEMANDER un son a la cantonade, et que quelqu un
 * l entende — ou personne.
 *
 * DEUX DEFAUTS REELS TOMBENT AVEC L INVERSION, et ils ne se voyaient
 * pas dans le graphe :
 *
 *   1. `useSound()` LEVE quand il n y a pas de fournisseur. Un bouton,
 *      la brique la plus reutilisee de l application, ne pouvait donc
 *      pas etre rendu seul — ni dans un test, ni dans une page qui
 *      oublie le fournisseur. Ici, sans joueur publie, on ne fait rien.
 *
 *   2. `play` est un `useCallback` qui depend de `settings`, et la
 *      valeur du contexte est memorisee sur `[playTone, setSettings,
 *      settings]`. Chaque changement de reglage — bouger la glissiere
 *      de volume — changeait donc l identite de la valeur et
 *      re-rendait TOUS les abonnes : chaque bouton, chaque
 *      interrupteur, chaque jeu d onglets de l arbre monte. Les quatre
 *      primitifs ne s abonnent plus a rien.
 *
 * CE QUE CE FICHIER NE FAIT PAS : du son. Il ne connait ni Web Audio,
 * ni les reglages, ni les seuils anti-empilement. Il tient une seule
 * reference mutable et la rend appelable depuis le rang 1. Toute la
 * mecanique reste dans `SoundContext`, qui la publie ici.
 * ═══════════════════════════════════════════════════════════════
 */

/* Les deux types descendent avec la fonction : un module de rang 1 ne
   peut pas aller chercher la forme de ses arguments au rang 3.
   `SoundContext` les reexporte, aucun appelant ne change. */
export type SoundCategory = "ui" | "success" | "progress" | "neutral";

export type SoundSettings = {
  masterEnabled: boolean;
  volume: number; // 0..1
  uiEnabled: boolean;
  successEnabled: boolean;
  progressEnabled: boolean;
};

export type JoueurDeSon = (categorie: SoundCategory, variante?: "soft" | "reward") => void;

/* Le silence est la valeur par defaut, et c est deliberé : avant que le
   fournisseur soit monte — ou dans un test qui n en monte pas —
   demander un son ne doit rien casser. */
const SILENCE: JoueurDeSon = () => {};

let joueur: JoueurDeSon = SILENCE;

/**
 * Publie le joueur reel. Rend la fonction qui le retire — a appeler au
 * demontage du fournisseur.
 *
 * Le retrait verifie que c est bien SON joueur qui est encore en place :
 * en developpement, React monte, demonte et remonte les effets, et un
 * retrait aveugle rendrait l application muette apres le remontage.
 */
export function publierJoueurDeSon(j: JoueurDeSon): () => void {
  joueur = j;
  return () => {
    if (joueur === j) joueur = SILENCE;
  };
}

/** Demande un son. Sans joueur publie, ne fait rien. */
export function jouerSon(categorie: SoundCategory, variante: "soft" | "reward" = "soft"): void {
  joueur(categorie, variante);
}
