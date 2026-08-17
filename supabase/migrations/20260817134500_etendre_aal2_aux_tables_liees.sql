-- Etendre l'obligation de second facteur aux tables rattachees indirectement.
--
-- La migration 20260816143315 bouclait sur les tables portant une colonne
-- user_id : 75 tables ont ete couvertes. Les tables qui rattachent
-- l'utilisateur autrement — par pact_id, par goal_id, par guild_id, ou par
-- id = auth.uid() pour profiles — sont restees a decouvert. Avec le seul mot
-- de passe, sans le code TOTP, elles restaient donc lisibles.
--
-- Les 15 tables de catalogue public (boutique, cosmetiques, saisons,
-- achievement_definitions, journal_prompts, feature_flags, promo_codes,
-- guild_ranks, coach_cron_runs) sont volontairement exclues : elles ne
-- contiennent aucune reference utilisateur, et les proteger viderait la
-- boutique et certains ecrans avant validation du second facteur.
--
-- goal_templates est inclus malgre son apparence de catalogue : il porte une
-- colonne created_by et contient donc des gabarits utilisateur.
--
-- La politique reutilise public.a_un_second_facteur(), fonction SECURITY
-- DEFINER creee par la migration precedente. Interroger auth.mfa_factors
-- directement provoquerait une erreur 42501 (le role authenticated n'a pas le
-- droit SELECT dessus), ce qui renverrait 403 sur toute l'application.
--
-- RESTRICTIVE FOR ALL sans WITH CHECK : PostgreSQL reutilise alors
-- l'expression USING comme WITH CHECK, donc les ecritures sont couvertes.
--
-- Annulation : supabase/migrations/annulations/20260817134500_annuler.sql

do $$
declare
  t text;
  tables_ciblees constant text[] := array[
    -- Objectifs et progression
    'goals',
    'steps',
    'step_status_history',
    'goal_contracts',
    'contract_signatures',
    'goal_cost_items',
    'goal_tags',
    'goal_templates',
    -- Identite
    'profiles',
    -- Messagerie et social
    'private_messages',
    'friendships',
    'user_blocks',
    'community_reports',
    -- Guildes
    'guilds',
    'guild_announcements',
    'guild_events',
    'guild_goals',
    'guild_invite_codes',
    'guild_invites',
    -- Partages
    'shared_goals',
    'shared_pacts',
    -- Journal d'administration
    'admin_audit_log'
  ];
begin
  foreach t in array tables_ciblees loop
    -- Ne rien tenter sur une table absente : la migration doit reussir sur une
    -- base ou le schema aurait diverge.
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relkind = 'r'
    ) then
      raise notice 'Table publique absente, ignoree : %', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists mfa_aal2_requis on public.%I', t);
    execute format(
      'create policy mfa_aal2_requis on public.%I'
      ' as restrictive for all to authenticated'
      ' using ((not public.a_un_second_facteur())'
      '        or ((select auth.jwt() ->> ''aal'') = ''aal2''))',
      t
    );
  end loop;
end
$$;
