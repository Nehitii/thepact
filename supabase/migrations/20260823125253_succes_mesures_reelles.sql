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

-- ═══════════════════════════════════════════════════════════════
-- LES SUCCES ETAIENT JUGES SUR DES COMPTEURS QUI AVAIENT DERIVE
-- ═══════════════════════════════════════════════════════════════
--
-- achievement_tracking porte quarante-cinq compteurs, incrementes par
-- le code au moment de l action. Un chemin qui oublie d incrementer,
-- une suppression qui ne decremente pas, un import : et le compteur
-- s ecarte. Mesure sur un seul compte :
--
--   todos_created            0  · alors qu il y a 67 taches
--   todos_completed          4  · alors qu il y en a 66 de faites
--   guilds_joined            0  · alors qu une guilde est fondee
--   community_posts          0  · alors qu une publication existe
--   journal_entries          3  · alors qu il y en a 7
--   total_goals_created     32  · alors qu il y a 38 objectifs
--   pomodoro_sessions       29  · alors que la table est VIDE
--   calendar_events_created  6  · alors qu il y en a 2
--
-- Ils derivent DANS LES DEUX SENS : des succes gagnes ne se
-- declenchent pas, et d autres se sont ouverts sans raison.
--
-- On cesse donc de leur faire confiance pour tout ce qui se compte.
-- Ce qui ne se deduit d aucune table — une serie de connexions, une
-- heure de connexion, un objectif fini en trois minutes — reste suivi,
-- parce qu il n existe nulle part ailleurs. Le reste est COMPTE.

create or replace function public.mesures_du_membre(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pacte uuid;
  v_suivi jsonb;
  v_calcule jsonb;
begin
  select coalesce(
    (select pr.active_pact_id from profiles pr where pr.id = p_user_id),
    (select pa.id from pacts pa where pa.user_id = p_user_id order by pa.created_at desc limit 1)
  ) into v_pacte;

  /* Ce qui ne se deduit d aucune table : series de connexion, heures,
     et les « instants » booleens que seul le code peut constater. */
  select coalesce(to_jsonb(t), '{}'::jsonb) into v_suivi
    from achievement_tracking t where t.user_id = p_user_id;

  select jsonb_build_object(
    -- ── Les objectifs ──
    'total_goals_created', (select count(*) from goals where pact_id = v_pacte),
    'goals_completed_total', (select count(*) from goals
       where pact_id = v_pacte and status in ('fully_completed', 'validated')),
    'steps_completed_total', (select count(*) from steps s join goals g on g.id = s.goal_id
       where g.pact_id = v_pacte and s.status = 'completed'),

    'easy_goals_created', (select count(*) from goals where pact_id = v_pacte and difficulty = 'easy'),
    'medium_goals_created', (select count(*) from goals where pact_id = v_pacte and difficulty = 'medium'),
    'hard_goals_created', (select count(*) from goals where pact_id = v_pacte and difficulty = 'hard'),
    'extreme_goals_created', (select count(*) from goals where pact_id = v_pacte and difficulty = 'extreme'),
    'impossible_goals_created', (select count(*) from goals where pact_id = v_pacte and difficulty = 'impossible'),

    'easy_goals_completed', (select count(*) from goals where pact_id = v_pacte
       and difficulty = 'easy' and status in ('fully_completed', 'validated')),
    'medium_goals_completed', (select count(*) from goals where pact_id = v_pacte
       and difficulty = 'medium' and status in ('fully_completed', 'validated')),
    'hard_goals_completed', (select count(*) from goals where pact_id = v_pacte
       and difficulty = 'hard' and status in ('fully_completed', 'validated')),
    'extreme_goals_completed', (select count(*) from goals where pact_id = v_pacte
       and difficulty = 'extreme' and status in ('fully_completed', 'validated')),
    'impossible_goals_completed', (select count(*) from goals where pact_id = v_pacte
       and difficulty = 'impossible' and status in ('fully_completed', 'validated')),

    -- ── Le reste du produit ──
    'todos_created', (select count(*) from todo_tasks where user_id = p_user_id),
    'todos_completed', (select count(*) from todo_tasks where user_id = p_user_id and completed_at is not null),
    'journal_entries', (select count(*) from journal_entries where user_id = p_user_id),
    'calendar_events_created', (select count(*) from calendar_events where user_id = p_user_id),

    'pomodoro_sessions', (select count(*) from focus_sessions where user_id = p_user_id),
    'pomodoro_total_minutes', (select coalesce(sum(duration_minutes), 0) from focus_sessions where user_id = p_user_id),

    -- ── Les autres ──
    'friends_count', (select count(*) from friendships
       where status = 'accepted' and (sender_id = p_user_id or receiver_id = p_user_id)),
    'guilds_joined', (select count(*) from guild_members where user_id = p_user_id),
    'guild_messages_sent', (select count(*) from guild_messages where user_id = p_user_id),
    'community_posts', (select count(*) from community_posts where user_id = p_user_id),

    -- ── L envie et l argent ──
    'wishlist_items_added', (select count(*) from wishlist_items where user_id = p_user_id),
    'wishlist_items_acquired', (select count(*) from wishlist_items where user_id = p_user_id and acquired),
    'transactions_logged', (select count(*) from bond_transactions where user_id = p_user_id),
    'bonds_spent_total', (select coalesce(sum(abs(amount)), 0) from bond_transactions
       where user_id = p_user_id and amount < 0),
    'bonds_earned_total', (select coalesce(sum(amount), 0) from bond_transactions
       where user_id = p_user_id and amount > 0),

    'modules_purchased', (select count(*) from user_module_purchases where user_id = p_user_id),
    'cosmetics_owned', (select count(*) from user_cosmetics where user_id = p_user_id),

    -- ── LA SANTE, QUI N ETAIT MESUREE NULLE PART ──
    -- Ses sept succes portaient « count » et « days » la ou les
    -- quatre-vingt-treize autres portent « value » : du code qui lit
    -- conditions.value n y voyait rien, et aucun n a jamais pu
    -- s ouvrir. Les mesures existent pourtant.
    'health_checkins', (select count(*) from health_data where user_id = p_user_id),
    'health_streak', (select coalesce(max(current_streak), 0) from health_streaks where user_id = p_user_id),
    'health_hydration_streak', (select count(*) from health_data
       where user_id = p_user_id and coalesce(hydration_glasses, 0) >= 8),
    'health_low_stress', (select count(*) from health_data
       where user_id = p_user_id and stress_level is not null and stress_level <= 3),
    'health_sleep_average', (select count(*) from health_data
       where user_id = p_user_id and coalesce(sleep_hours, 0) >= 8),

    -- ── Ce qui se constate, plutot que se compte ──
    'has_pact', (v_pacte is not null),
    'all_difficulties_created', (
      select count(distinct difficulty) >= 5 from goals
       where pact_id = v_pacte and difficulty is not null)
  ) into v_calcule;

  /* Le calcul l emporte sur le compteur : la ou les deux existent,
     c est la table source qui dit vrai. */
  return v_suivi || v_calcule;
end;
$$;

comment on function public.mesures_du_membre(uuid) is
  'Les mesures d une personne, comptees sur les tables sources plutot que lues dans des compteurs denormalises qui ont derive.';
