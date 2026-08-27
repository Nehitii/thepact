-- ═══════════════════════════════════════════════════════════════
-- LES TABLES DU COACH PRENNENT SON NOM
--
-- L'application appelait la même entité de deux façons : « M.I.A »
-- à l'écran, « coach » dans la base. Les textes visibles et les noms
-- de fonctions Edge ont déjà été alignés ; il restait cinq tables,
-- leurs douze contraintes, leurs six index, un déclencheur et une
-- fonction de recherche vectorielle.
--
-- ÉTAT MESURÉ AVANT :
--
--   coach_conversations   48 kB     5 politiques RLS
--   coach_cron_runs      192 kB     1 politique
--   coach_embeddings    1768 kB     5 politiques
--   coach_insights        88 kB     4 politiques
--   coach_messages       120 kB     5 politiques
--
--   match_coach_memory(vector, integer, double precision)
--     SECURITY DEFINER, EXECUTE à postgres, authenticated, service_role
--
-- ═══ POURQUOI DES VUES DE COMPATIBILITÉ ═══
--
-- Le front en production est un Worker Cloudflare (« thepact »)
-- figé au 22 août. Il interroge `coach_messages` et
-- `coach_conversations` par PostgREST. Renommer les tables sans
-- filet, c'est le casser jusqu'à sa prochaine mise en ligne — pour
-- une question de vocabulaire.
--
-- On crée donc cinq vues portant les ANCIENS noms. Trois précautions :
--
--   1. `security_invoker = true`. Sans ça, une vue s'exécute avec les
--      droits de son PROPRIÉTAIRE et court-circuite la RLS de la
--      table : les vues de compatibilité deviendraient une porte
--      dérobée sur les données de tout le monde. C'est le point le
--      plus dangereux de cette migration.
--   2. Vues SIMPLES sur une seule table, donc modifiables
--      automatiquement : le front écrit à travers, et les valeurs
--      par défaut de la table de base s'appliquent toujours.
--   3. Aucune jointure imbriquée PostgREST ne les traverse — vérifié
--      dans le dépôt : tous les appels sont des `.from()` plats. Une
--      vue ne porte pas de clé étrangère, donc un `select` imbriqué
--      aurait cessé de fonctionner sans prévenir.
--
-- `match_coach_memory` est conservée aussi, mais vidée de sa logique :
-- elle délègue à `match_mia_memory`. Une seule requête à maintenir.
--
-- ═══ CE QUI RESTE À FAIRE APRÈS ═══
--
-- Une fois le front remis en ligne, les cinq vues et l'ancienne
-- fonction n'ont plus de lecteur. Elles se retirent avec le fichier
-- d'annulation partielle prévu à cet effet.
--
-- ═══ ANNULATION COMPLÈTE ═══
--
--   supabase/migrations/annulations/20260827194500_annuler.sql
--
-- ═══════════════════════════════════════════════════════════════

begin;

-- ─── 1. Les tables ───────────────────────────────────────────────
alter table public.coach_conversations rename to mia_conversations;
alter table public.coach_cron_runs     rename to mia_cron_runs;
alter table public.coach_embeddings    rename to mia_embeddings;
alter table public.coach_insights      rename to mia_insights;
alter table public.coach_messages      rename to mia_messages;

-- ─── 2. Les contraintes ──────────────────────────────────────────
-- Renommer une contrainte de clé primaire renomme aussi son index :
-- les deux sont le même objet.
alter table public.mia_conversations rename constraint coach_conversations_pkey            to mia_conversations_pkey;
alter table public.mia_conversations rename constraint coach_conversations_user_id_fkey    to mia_conversations_user_id_fkey;
alter table public.mia_cron_runs     rename constraint coach_cron_runs_pkey                to mia_cron_runs_pkey;
alter table public.mia_embeddings    rename constraint coach_embeddings_pkey               to mia_embeddings_pkey;
alter table public.mia_embeddings    rename constraint coach_embeddings_source_type_check  to mia_embeddings_source_type_check;
alter table public.mia_embeddings    rename constraint coach_embeddings_user_id_fkey       to mia_embeddings_user_id_fkey;
alter table public.mia_insights      rename constraint coach_insights_pkey                 to mia_insights_pkey;
alter table public.mia_insights      rename constraint coach_insights_user_id_fkey         to mia_insights_user_id_fkey;
alter table public.mia_messages      rename constraint coach_messages_conversation_id_fkey to mia_messages_conversation_id_fkey;
alter table public.mia_messages      rename constraint coach_messages_pkey                 to mia_messages_pkey;
alter table public.mia_messages      rename constraint coach_messages_role_check           to mia_messages_role_check;
alter table public.mia_messages      rename constraint coach_messages_user_id_fkey         to mia_messages_user_id_fkey;

-- ─── 3. Les index qui ne viennent pas d'une contrainte ───────────
alter index public.idx_coach_conv_user            rename to idx_mia_conv_user;
alter index public.idx_coach_cron_runs_started    rename to idx_mia_cron_runs_started;
alter index public.idx_coach_emb_user             rename to idx_mia_emb_user;
alter index public.idx_coach_emb_vec              rename to idx_mia_emb_vec;
alter index public.idx_coach_insights_user_active rename to idx_mia_insights_user_active;
alter index public.idx_coach_msg_conv             rename to idx_mia_msg_conv;

-- ─── 4. Le déclencheur ───────────────────────────────────────────
alter trigger trg_coach_conv_updated on public.mia_conversations rename to trg_mia_conv_updated;

-- ─── 5. La recherche vectorielle ─────────────────────────────────
-- `alter function ... rename` ne toucherait pas au CORPS, qui cite la
-- table. On récrit donc la fonction sous son nouveau nom.
create or replace function public.match_mia_memory(
  _query vector,
  _match_count integer default 8,
  _min_similarity double precision default 0.7
)
returns table(id uuid, source_type text, source_id uuid, content text, metadata jsonb, similarity double precision)
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT id, source_type, source_id, content, metadata,
         1 - (embedding <=> _query) AS similarity
  FROM public.mia_embeddings
  WHERE user_id = auth.uid()
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> _query) >= _min_similarity
  ORDER BY embedding <=> _query
  LIMIT _match_count;
$function$;

-- Les droits sont recopiés de l'ancienne, à l'identique. Une
-- `alter default privileges ... revoke execute ... from public` est
-- en vigueur depuis le 27/08 : sans ce grant explicite, personne ne
-- pourrait appeler la nouvelle fonction.
grant execute on function public.match_mia_memory(vector, integer, double precision)
  to authenticated, service_role;

-- L'ancienne délègue. Elle ne contient plus de requête : il n'y a
-- qu'un seul endroit où la logique vit.
create or replace function public.match_coach_memory(
  _query vector,
  _match_count integer default 8,
  _min_similarity double precision default 0.7
)
returns table(id uuid, source_type text, source_id uuid, content text, metadata jsonb, similarity double precision)
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT * FROM public.match_mia_memory(_query, _match_count, _min_similarity);
$function$;

grant execute on function public.match_coach_memory(vector, integer, double precision)
  to authenticated, service_role;

-- ─── 6. Les vues de compatibilité ───────────────────────────────
create view public.coach_conversations with (security_invoker = true) as select * from public.mia_conversations;
create view public.coach_cron_runs     with (security_invoker = true) as select * from public.mia_cron_runs;
create view public.coach_embeddings    with (security_invoker = true) as select * from public.mia_embeddings;
create view public.coach_insights      with (security_invoker = true) as select * from public.mia_insights;
create view public.coach_messages      with (security_invoker = true) as select * from public.mia_messages;

-- Les mêmes droits que les tables : c'est la RLS qui protège, pas le
-- grant, et `security_invoker` la fait s'appliquer normalement.
grant select, insert, update, delete on
  public.coach_conversations, public.coach_cron_runs, public.coach_embeddings,
  public.coach_insights, public.coach_messages
  to anon, authenticated, service_role;

-- ─── 7. Vérification, dans la même transaction ───────────────────
-- Si l'une de ces assertions tombe, la migration entière est annulée.
do $$
declare
  n_tables      integer;
  n_vues        integer;
  sans_invoker  integer;
  n_politiques  integer;
  n_lignes      integer;
begin
  select count(*) into n_tables
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'mia\_%';
  if n_tables <> 5 then
    raise exception 'attendu 5 tables mia_*, trouvé %', n_tables;
  end if;

  select count(*) into n_vues
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v' and c.relname like 'coach\_%';
  if n_vues <> 5 then
    raise exception 'attendu 5 vues coach_*, trouvé %', n_vues;
  end if;

  -- LE POINT DANGEREUX : une vue sans security_invoker ignorerait la
  -- RLS de sa table. On refuse de livrer si l'option manque.
  select count(*) into sans_invoker
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v' and c.relname like 'coach\_%'
      and coalesce(array_to_string(c.reloptions, ','), '') not like '%security_invoker=true%';
  if sans_invoker <> 0 then
    raise exception '% vue(s) de compatibilité sans security_invoker : elles court-circuiteraient la RLS', sans_invoker;
  end if;

  -- Les politiques suivent le renommage ; on le vérifie plutôt que de
  -- le supposer. 5 + 1 + 5 + 4 + 5 = 20.
  select count(*) into n_politiques
    from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname like 'mia\_%';
  if n_politiques <> 20 then
    raise exception 'attendu 20 politiques RLS sur mia_*, trouvé %', n_politiques;
  end if;

  -- Les données sont bien là, et lisibles par les deux noms.
  select count(*) into n_lignes from public.mia_messages;
  if n_lignes <> (select count(*) from public.coach_messages) then
    raise exception 'la vue et la table ne voient pas le même nombre de lignes';
  end if;

  raise notice 'ok : 5 tables, 5 vues security_invoker, 20 politiques, % messages', n_lignes;
end $$;

commit;
