/* L AUTHENTIFICATION — le sas, et rien d autre.
 *
 * UNE PORTE VIDE. Sept fichiers : deux pages, un hook, deux tests,
 * deux feuilles. Personne n importe ce domaine — on n y entre que par
 * les routes « /auth » et « /two-factor », et on n en sort qu une fois
 * la session posee.
 *
 * CE QUE CETTE FRONTIERE PROTEGE, EN PRATIQUE : la session vit dans le
 * socle (`socle/contextes/AuthContext`), pas ici. Ce domaine ne
 * FOURNIT pas l identite, il la DEMANDE. Un composant qui voudrait
 * savoir « qui est connecte » n a donc rien a chercher de ce cote —
 * c est exactement pourquoi la porte est vide, et pourquoi il ne faut
 * pas la remplir « au cas ou ».
 *
 * Il ne dependait deja de presque rien : le client Supabase, deux
 * outils d erreurs, et la porte du profil pour le second facteur. Ce
 * dernier fil est le seul qui traverse, et il va dans le bon sens —
 * le sas interroge le profil, jamais l inverse.
 *
 * SES DEUX FEUILLES ETAIENT DEJA DOMANIALES avant qu on les range :
 * chacune est importee par sa page, aucune n est globale. C est le
 * seul domaine du lot dont le CSS n avait rien a corriger.
 */
export {};
