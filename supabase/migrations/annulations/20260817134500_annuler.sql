-- Annulation de 20260817134500_etendre_aal2_aux_tables_liees.sql
--
-- A executer si l'extension du second facteur aux tables liees casse
-- l'application. Ne retire que les politiques posees par cette migration :
-- les 75 tables couvertes par 20260816143315 conservent les leurs, et la
-- fonction public.a_un_second_facteur() reste en place.

do $$
declare
  t text;
  tables_ciblees constant text[] := array[
    'goals', 'steps', 'step_status_history', 'goal_contracts',
    'contract_signatures', 'goal_cost_items', 'goal_tags', 'goal_templates',
    'profiles', 'private_messages', 'friendships', 'user_blocks',
    'community_reports', 'guilds', 'guild_announcements', 'guild_events',
    'guild_goals', 'guild_invite_codes', 'guild_invites', 'shared_goals',
    'shared_pacts', 'admin_audit_log'
  ];
begin
  foreach t in array tables_ciblees loop
    if exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relkind = 'r'
    ) then
      execute format('drop policy if exists mfa_aal2_requis on public.%I', t);
    end if;
  end loop;
end
$$;
