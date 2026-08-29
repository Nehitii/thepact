/* L ONBOARDING — la creation du pacte, une seule fois.
 *
 * PORTE VIDE : on n y entre que par la route « /onboarding », et on
 * n y revient jamais.
 *
 * POURQUOI CE MOT ANGLAIS DANS UN CODE FRANCAIS. Parce que c est celui
 * que l application affiche : « Complete d abord l onboarding »
 * (fr.json), et l espace de traduction s appelle deja `onboarding`.
 * La regle de langue posee a l etape 1 demande que le code parle comme
 * l ecran, pas qu il parle francais ; inventer « embarquement » ici
 * aurait creuse l ecart que le glossaire sert justement a fermer.
 *
 * IL EST DISTINCT DE L AUTHENTIFICATION, et la donnee le dit :
 * le sas ne fait que prouver QUI on est, l onboarding ecrit ce qu on
 * VEUT — `pacts`, `profiles`, `goals`, et surtout `user_values`, la
 * seule table de l application que personne d autre ne touche.
 */
export {};
