/**
 * LA PORTE DU DOMAINE JOURNAL — ET ELLE EST VIDE.
 *
 * Ce n est pas un oubli, c est le releve. Rien, dans le reste de
 * l application, n appelle le journal : ni l editeur, ni les entrees,
 * ni les familles de questions, ni les marques de mise en forme. La
 * seule chose que le dehors demande, c est la PAGE — et les pages ne
 * passent pas par la porte : `app/prefetchRoutes.ts` les charge en
 * differe, une par route.
 *
 * Le journal est donc le premier domaine entierement clos. Un fichier
 * d index vide vaut mieux que pas de fichier : il dit que la question
 * a ete posee.
 *
 * DEUX FAUX AMIS ONT ETE ECARTES, tous deux sur leur nom :
 *
 *   `lib/journalSecurite.ts` — c est le journal de CONNEXIONS, la table
 *   `security_events`, lue par les ecrans de compte et de MFA. Il
 *   n a rien a voir avec le journal intime et reste dehors.
 *
 *   `components/journal/JournalDecorations.tsx` — cinq composants
 *   decoratifs que le journal n importait PAS. Son unique lecteur etait
 *   `DSPageHeader`, qui n en prenait que deux ; les trois autres
 *   n avaient aucune reference dans tout le depot. Les deux vivants
 *   sont passes dans `components/ds/Decorations.tsx`, les trois morts
 *   sont supprimes.
 *
 * ET `journal.css` N EST PAS ENTREE. Elle porte le nom du domaine mais
 * declare `font-orbitron`, citee par 64 fichiers, plus le fond et deux
 * animations du systeme de design. Elle reste globale jusqu a l etape 4,
 * qui la separera. Voir l en-tete du fichier.
 */
export {};
