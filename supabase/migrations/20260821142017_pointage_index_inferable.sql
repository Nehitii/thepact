-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-21
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

-- L INDEX DOIT POUVOIR ETRE INFERE PAR ON CONFLICT
--
-- L index etait partiel — « where ligne_id is not null » — pour dire
-- que les pointages archives, dont la ligne recurrente a ete
-- supprimee, ne se dedoublonnent pas entre eux. L intention etait
-- juste, la mise en oeuvre non : Postgres refuse d inferer une
-- contrainte partielle depuis un ON CONFLICT (colonnes), et PostgREST
-- ne sait pas transmettre le predicat. Chaque pointage repondait donc
-- 42P10, et cocher une case ne faisait rien.
--
-- L index complet obtient le meme resultat sans le defaut : Postgres
-- traite les NULL comme distincts dans un index unique, donc plusieurs
-- archives cohabitent toujours, et une ligne vivante reste unique par
-- mois.

drop index if exists public.pointages_une_ligne_par_mois;

create unique index if not exists pointages_une_ligne_par_mois
  on public.pointages_du_mois (user_id, mois, ligne_id);
