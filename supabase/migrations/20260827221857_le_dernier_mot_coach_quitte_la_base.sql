-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-27
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

-- Le dernier identifiant portant « coach » dans la base.
--
-- L'ORDRE A ETE CHOISI POUR RACCOURCIR LA PANNE, pas pour l'eviter :
-- aucun des deux ordres ne l'evite. Renommer avant le deploiement
-- aurait casse le site en ligne pendant tout le temps qu'il aurait
-- fallu pour deployer. Renommer apres ne le casse que le temps de
-- cette migration.
--
-- CE QUI EST CASSE PENDANT CES QUELQUES SECONDES : l'interrupteur
-- « M.I.A proactive » des reglages de notification, et lui seul.
-- Verifie avant : 9 occurrences dans le depot, toutes dans quatre
-- fichiers (useNotifications.ts, NotificationSettings.tsx,
-- mia-pattern-detect, mia-weekly-digest).
--
-- ANNULATION :
--   alter table public.notification_settings
--     rename column mia_proactive_enabled to coach_proactive_enabled;
--   (a jouer AVEC un front reconstruit sur l'ancien nom, sinon on
--    rouvre la meme fenetre dans l'autre sens)

alter table public.notification_settings
  rename column coach_proactive_enabled to mia_proactive_enabled;

do $$
declare
  n_ancien integer;
  n_neuf   integer;
  v_type   text;
  v_defaut text;
  n_coach  integer;
begin
  select count(*) into n_ancien
    from information_schema.columns
   where table_schema = 'public' and table_name = 'notification_settings'
     and column_name = 'coach_proactive_enabled';
  if n_ancien <> 0 then
    raise exception 'coach_proactive_enabled existe encore';
  end if;

  select count(*), max(data_type), max(column_default)
    into n_neuf, v_type, v_defaut
    from information_schema.columns
   where table_schema = 'public' and table_name = 'notification_settings'
     and column_name = 'mia_proactive_enabled';
  if n_neuf <> 1 then
    raise exception 'mia_proactive_enabled introuvable';
  end if;

  -- UN RENOMMAGE NE CHANGE NI LE TYPE NI LE DEFAUT. On le verifie
  -- plutot que de le supposer : un defaut perdu ferait basculer tout
  -- le monde a NULL, donc a « active » par le repli du client.
  if v_type <> 'boolean' then
    raise exception 'le type a change : %', v_type;
  end if;
  if v_defaut is distinct from 'true' then
    raise exception 'le defaut a change : %', coalesce(v_defaut, 'NULL');
  end if;

  -- Et plus AUCUN objet du schema public ne porte « coach ».
  select count(*) into n_coach
    from (
      select 1 from information_schema.columns
       where table_schema = 'public' and column_name like '%coach%'
      union all
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname like '%coach%'
      union all
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname like '%coach%'
    ) t;
  if n_coach <> 0 then
    raise exception 'il reste % objet(s) portant « coach » dans public', n_coach;
  end if;
end $$;
