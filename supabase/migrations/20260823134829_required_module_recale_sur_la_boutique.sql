-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-23
-- sans qu un fichier soit ecrit dans le depot. Elle n existait plus
-- que dans « supabase_migrations.schema_migrations », qui garde le SQL
-- de chaque migration en plus de son numero.
--
-- Le contenu ci-dessous est celui du registre, mot pour mot — la prose
-- d origine comprise. Rien n a ete reecrit.
--
-- NE PAS LA REJOUER : elle est deja appliquee. Elle est ici pour que
-- « supabase/migrations » redevienne un compte rendu fidele du schema,
-- et pour qu un environnement neuf puisse etre reconstruit.
-- ═══════════════════════════════════════════════════════════════════

-- required_module N AVAIT JAMAIS ETE LU — je viens de le faire lire, et
-- il s est avere PERIME. Sept de ses huit valeurs ne correspondent a
-- aucun module de la boutique :
--
--   track-finance  → le module s appelle « finance »
--   neural-journal → « journal »
--   todo-matrix    → « todo-list »
--   pact-wishlist  → « wishlist »
--   track-health   → correct, le seul
--
--   schedule-hub   → AUCUN module de calendrier n existe
--   focus-timer    → AUCUN module de concentration n existe
--   community-hub  → AUCUN module de communaute n existe
--
-- Une colonne jamais lue derive sans bruit : les noms ont change en
-- boutique et personne n a eu de raison de la suivre. C est le risque
-- de tout champ qu on renseigne « pour plus tard ».
--
-- Les quatre premiers sont recales. Les trois derniers designent des
-- fonctionnalites qui ne se VENDENT PAS : les gater sur un achat
-- impossible les condamnerait. Leur exigence tombe — et leur libelle
-- cesse de promettre un module qui n existe pas.

update public.achievement_definitions set required_module = 'finance'   where required_module = 'track-finance';
update public.achievement_definitions set required_module = 'journal'   where required_module = 'neural-journal';
update public.achievement_definitions set required_module = 'todo-list' where required_module = 'todo-matrix';
update public.achievement_definitions set required_module = 'wishlist'  where required_module = 'pact-wishlist';

update public.achievement_definitions
   set required_module = null,
       description    = regexp_replace(description, '\s*\(requires [^)]*\)', ''),
       description_fr = regexp_replace(description_fr, '\s*\(module [^)]*\)', '')
 where required_module in ('schedule-hub', 'focus-timer', 'community-hub');
