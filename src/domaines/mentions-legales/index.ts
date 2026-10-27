/* LES MENTIONS LEGALES — le seul domaine sans donnee.
 *
 * PORTE VIDE : on n y entre que par la route « /legal ».
 *
 * Une page, un contenu, un test, une feuille. Aucune requete, aucune
 * table, aucun hook : c est du texte qui doit rester exact. C est
 * precisement pour cela qu il est range comme les autres plutot que
 * laisse dans un dossier `content/` a la racine — un texte qu on ne
 * trouve pas est un texte qu on ne met pas a jour, et celui-ci a une
 * date de derniere revision a l interieur.
 *
 * Son test verifie le contenu, pas le rendu : que chaque article
 * annonce existe, que les coordonnees soient la, que les dates soient
 * coherentes. Il a suivi le contenu et s appelle `contenu.test.ts`.
 */
export {};
