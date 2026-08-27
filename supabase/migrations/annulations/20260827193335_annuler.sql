-- ═══════════════════════════════════════════════════════════════
-- ANNULER : les tables du coach reprennent leur ancien nom
--
-- À jouer si le renommage pose problème. Il remet exactement l'état
-- mesuré avant le 27/08 19h45 : cinq tables `coach_*`, leurs
-- contraintes et index d'origine, et `match_coach_memory` portant sa
-- propre requête.
--
-- ORDRE OBLIGATOIRE : les vues d'abord. Tant qu'une vue nommée
-- `coach_messages` existe, on ne peut pas y renommer une table.
--
-- CE FICHIER NE PERD AUCUNE DONNÉE : un renommage ne déplace rien.
-- ═══════════════════════════════════════════════════════════════

begin;

drop view if exists public.coach_conversations;
drop view if exists public.coach_cron_runs;
drop view if exists public.coach_embeddings;
drop view if exists public.coach_insights;
drop view if exists public.coach_messages;

drop function if exists public.match_mia_memory(vector, integer, double precision);

alter table public.mia_conversations rename to coach_conversations;
alter table public.mia_cron_runs     rename to coach_cron_runs;
alter table public.mia_embeddings    rename to coach_embeddings;
alter table public.mia_insights      rename to coach_insights;
alter table public.mia_messages      rename to coach_messages;

alter table public.coach_conversations rename constraint mia_conversations_pkey            to coach_conversations_pkey;
alter table public.coach_conversations rename constraint mia_conversations_user_id_fkey    to coach_conversations_user_id_fkey;
alter table public.coach_cron_runs     rename constraint mia_cron_runs_pkey                to coach_cron_runs_pkey;
alter table public.coach_embeddings    rename constraint mia_embeddings_pkey               to coach_embeddings_pkey;
alter table public.coach_embeddings    rename constraint mia_embeddings_source_type_check  to coach_embeddings_source_type_check;
alter table public.coach_embeddings    rename constraint mia_embeddings_user_id_fkey       to coach_embeddings_user_id_fkey;
alter table public.coach_insights      rename constraint mia_insights_pkey                 to coach_insights_pkey;
alter table public.coach_insights      rename constraint mia_insights_user_id_fkey         to coach_insights_user_id_fkey;
alter table public.coach_messages      rename constraint mia_messages_conversation_id_fkey to coach_messages_conversation_id_fkey;
alter table public.coach_messages      rename constraint mia_messages_pkey                 to coach_messages_pkey;
alter table public.coach_messages      rename constraint mia_messages_role_check           to coach_messages_role_check;
alter table public.coach_messages      rename constraint mia_messages_user_id_fkey         to coach_messages_user_id_fkey;

alter index public.idx_mia_conv_user            rename to idx_coach_conv_user;
alter index public.idx_mia_cron_runs_started    rename to idx_coach_cron_runs_started;
alter index public.idx_mia_emb_user             rename to idx_coach_emb_user;
alter index public.idx_mia_emb_vec              rename to idx_coach_emb_vec;
alter index public.idx_mia_insights_user_active rename to idx_coach_insights_user_active;
alter index public.idx_mia_msg_conv             rename to idx_coach_msg_conv;

alter trigger trg_mia_conv_updated on public.coach_conversations rename to trg_coach_conv_updated;

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
  SELECT id, source_type, source_id, content, metadata,
         1 - (embedding <=> _query) AS similarity
  FROM public.coach_embeddings
  WHERE user_id = auth.uid()
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> _query) >= _min_similarity
  ORDER BY embedding <=> _query
  LIMIT _match_count;
$function$;

grant execute on function public.match_coach_memory(vector, integer, double precision)
  to authenticated, service_role;

commit;
