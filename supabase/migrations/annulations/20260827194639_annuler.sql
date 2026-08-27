-- ANNULER : le drapeau d'écriture reprend son ancien nom.
--
-- À jouer AVEC le redéploiement d'ai-mia sur un code qui lit
-- « coach_write_tools » : renommer la clé sans revenir sur le code
-- ferait chercher à la fonction une clé inexistante, et
-- `drapeauOuvert` rendrait « fermé » — M.I.A perdrait ses onze outils
-- d'écriture sans qu'aucune erreur ne soit levée.

update public.feature_flags
   set key = 'coach_write_tools'
 where key = 'mia_write_tools';

update public.user_feature_overrides
   set key = 'coach_write_tools'
 where key = 'mia_write_tools';
