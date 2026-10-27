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

-- « CREATE OR REPLACE » ne remplace que si la SIGNATURE est identique.
-- Ajouter un parametre, meme avec une valeur par defaut, cree une
-- SECONDE fonction : les deux cohabitaient, et tout appel a un seul
-- argument devenait ambigu — y compris celui de rattraper_les_succes
-- et celui du client, qui aurait echoue a l execution.

drop function if exists public.succes_du_membre(uuid);
