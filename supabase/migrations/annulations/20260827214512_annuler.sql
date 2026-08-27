-- ANNULER : remettre la couche de compatibilité coach_*.
--
-- À jouer si l'on découvre qu'un lecteur des anciens noms existait
-- encore quelque part — un onglet resté ouvert sur l'ancien bundle,
-- un client tiers, une fonction Edge oubliée.
--
-- `security_invoker = true` N'EST PAS UNE OPTION DE CONFORT. Sans
-- elle, une vue s'exécute avec les droits de son propriétaire et
-- court-circuite la RLS de sa table : ces cinq vues deviendraient une
-- porte dérobée sur les données de tout le monde. C'est le point le
-- plus dangereux de ce fichier.

create view public.coach_conversations with (security_invoker = true) as select * from public.mia_conversations;
create view public.coach_cron_runs     with (security_invoker = true) as select * from public.mia_cron_runs;
create view public.coach_embeddings    with (security_invoker = true) as select * from public.mia_embeddings;
create view public.coach_insights      with (security_invoker = true) as select * from public.mia_insights;
create view public.coach_messages      with (security_invoker = true) as select * from public.mia_messages;

grant select, insert, update, delete on
  public.coach_conversations, public.coach_cron_runs, public.coach_embeddings,
  public.coach_insights, public.coach_messages
  to anon, authenticated, service_role;

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
