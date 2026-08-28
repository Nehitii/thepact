-- ═══════════════════════════════════════════════════════════════
-- LES VUES DE COMPATIBILITÉ N'ONT PLUS DE LECTEUR
--
-- Les cinq vues `coach_*` et `match_coach_memory` (20260827193335)
-- n'existaient que pour une raison : le Worker Cloudflare « thepact »
-- était figé au 22/08 et interrogeait encore les anciens noms.
-- Renommer les tables sans elles aurait cassé le site en production.
--
-- IL A ÉTÉ REDÉPLOYÉ. Et on ne le croit pas sur parole : le fichier
-- `/assets/MiaConsole-iKiIaY25.js` servi en production a été récupéré
-- et lu — 192 330 octets contenant « ai-mia », « mia_messages » et
-- « mia_conversations », et ne contenant NI « ai-coach » NI
-- « coach_messages ». La couche n'a plus de lecteur.
--
-- Côté dépôt, même vérification : plus aucune référence à `coach_*`
-- dans `src/` ni `supabase/functions/`, hormis `types.ts` — un fichier
-- généré depuis la base, où ces noms ne sont que des types effacés à
-- la compilation. Il est régénéré avec cette migration.
--
-- ═══ CE QU'ON NE TOUCHE PAS, ET POURQUOI ═══
--
-- La colonne `notification_settings.coach_proactive_enabled` garde son
-- nom. Le bundle mis en ligne vient de `main`, qui n'a PAS son
-- renommage — mesuré dans `/assets/NotificationSettings-CukF_c3c.js`,
-- qui contient « coach_proactive_enabled » et pas « mia_proactive_enabled ».
-- La renommer maintenant ferait échouer l'interrupteur « M.I.A
-- proactive » en production, et pire : il afficherait « activé » quoi
-- qu'il arrive, puisque la lecture retomberait sur `?? true`.
--
-- Elle se renommera quand une construction issue d'un arbre qui porte
-- le nouveau nom aura été mise en ligne. La dernière assertion
-- ci-dessous refuse cette migration si quelqu'un l'a déjà fait.
--
-- ANNULATION : supabase/migrations/annulations/20260827214512_annuler.sql
-- ═══════════════════════════════════════════════════════════════

drop view if exists public.coach_conversations;
drop view if exists public.coach_cron_runs;
drop view if exists public.coach_embeddings;
drop view if exists public.coach_insights;
drop view if exists public.coach_messages;

drop function if exists public.match_coach_memory(vector, integer, double precision);

do $$
declare
  n_vues     integer;
  n_fonction integer;
  n_tables   integer;
  n_pol      integer;
  n_msg      integer;
  n_col      integer;
begin
  select count(*) into n_vues
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v' and c.relname like 'coach\_%';
  if n_vues <> 0 then
    raise exception 'il reste % vue(s) coach_*', n_vues;
  end if;

  select count(*) into n_fonction
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'match_coach_memory';
  if n_fonction <> 0 then
    raise exception 'match_coach_memory existe encore';
  end if;

  /* CE QUI COMPTE VRAIMENT : on a retiré des VUES, pas des données.
     Une vue supprimée ne touche pas sa table — mais le vérifier coûte
     trois lignes, et une erreur ici coûterait tout. */
  select count(*) into n_tables
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'mia\_%';
  if n_tables <> 5 then
    raise exception 'attendu 5 tables mia_*, trouvé %', n_tables;
  end if;

  select count(*) into n_pol
    from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname like 'mia\_%';
  if n_pol <> 20 then
    raise exception 'attendu 20 politiques RLS sur mia_*, trouvé %', n_pol;
  end if;

  select count(*) into n_msg from public.mia_messages;
  if n_msg < 170 then
    raise exception 'mia_messages ne contient plus que % lignes', n_msg;
  end if;

  -- Celle que M.I.A utilise réellement doit rester.
  select count(*) into n_fonction
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'match_mia_memory';
  if n_fonction <> 1 then
    raise exception 'match_mia_memory a disparu';
  end if;

  -- Et la colonne ne doit PAS avoir bougé : le front en ligne la lit.
  select count(*) into n_col
    from information_schema.columns
   where table_schema = 'public' and table_name = 'notification_settings'
     and column_name = 'coach_proactive_enabled';
  if n_col <> 1 then
    raise exception 'coach_proactive_enabled a été renommée : le front en ligne ne sait plus la lire';
  end if;
end $$;
