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

-- Les conditions corrigees reclament six mesures qui n existaient pas.
-- Toutes se DEDUISENT — aucune ne demande d etre guettee au moment ou
-- elle se produit, ce qui condamnait jusqu ici tout ce qui avait eu
-- lieu avant l ecriture du code.
--
-- « tous les modules » et « toutes les categories cosmetiques » se
-- comptent PAR RAPPORT A CE QUI EXISTE, jamais par rapport a un nombre
-- fige : c est ce qui rendait « Arsenal complet » ingagnable, avec son
-- seuil de huit pour six modules.

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

  select coalesce(to_jsonb(t), '{}'::jsonb) into v_suivi
    from achievement_tracking t where t.user_id = p_user_id;

  select jsonb_build_object(
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

    'todos_created', (select count(*) from todo_tasks where user_id = p_user_id),
    'todos_completed', (select count(*) from todo_tasks where user_id = p_user_id and completed_at is not null),
    'journal_entries', (select count(*) from journal_entries where user_id = p_user_id),
    'calendar_events_created', (select count(*) from calendar_events where user_id = p_user_id),
    'pomodoro_sessions', (select count(*) from focus_sessions where user_id = p_user_id),
    'pomodoro_total_minutes', (select coalesce(sum(duration_minutes), 0) from focus_sessions where user_id = p_user_id),

    'friends_count', (select count(*) from friendships
       where status = 'accepted' and (sender_id = p_user_id or receiver_id = p_user_id)),
    'guilds_joined', (select count(*) from guild_members where user_id = p_user_id),
    'guild_messages_sent', (select count(*) from guild_messages where user_id = p_user_id),
    'community_posts', (select count(*) from community_posts where user_id = p_user_id),

    'wishlist_items_added', (select count(*) from wishlist_items where user_id = p_user_id),
    'wishlist_items_acquired', (select count(*) from wishlist_items where user_id = p_user_id and acquired),
    'transactions_logged', (select count(*) from bond_transactions where user_id = p_user_id),
    'bonds_spent_total', (select coalesce(sum(abs(amount)), 0) from bond_transactions
       where user_id = p_user_id and amount < 0),
    'bonds_earned_total', (select coalesce(sum(amount), 0) from bond_transactions
       where user_id = p_user_id and amount > 0),

    'modules_purchased', (select count(*) from user_module_purchases where user_id = p_user_id),
    'cosmetics_owned', (select count(*) from user_cosmetics where user_id = p_user_id),

    'health_checkins', (select count(*) from health_data where user_id = p_user_id),
    'health_streak', (select coalesce(max(current_streak), 0) from health_streaks where user_id = p_user_id),
    'health_hydration_streak', (select count(*) from health_data
       where user_id = p_user_id and coalesce(hydration_glasses, 0) >= 8),
    'health_low_stress', (select count(*) from health_data
       where user_id = p_user_id and stress_level is not null and stress_level <= 3),
    'health_sleep_average', (select count(*) from health_data
       where user_id = p_user_id and coalesce(sleep_hours, 0) >= 8),

    'has_pact', (v_pacte is not null),
    'all_difficulties_created', (
      select count(distinct difficulty) >= 5 from goals
       where pact_id = v_pacte and difficulty is not null),

    -- ══ LES SIX NOUVELLES ══

    /* « Tous les modules » se compte par rapport a CE QUI EXISTE. Le
       seuil fige a huit rendait le succes ingagnable : il y a six
       modules, et il n y en aura jamais huit a acheter. */
    'tous_les_modules', (
      (select count(*) from shop_modules) > 0
      and (select count(*) from user_module_purchases where user_id = p_user_id)
          >= (select count(*) from shop_modules)),

    /* Idem pour les cosmetiques : « un objet de chaque categorie »
       mesurait un total de cinq objets, ce qui s ouvrait sans qu on
       ait touche a toutes les categories. */
    'toutes_categories_cosmetiques', (
      (select count(distinct cosmetic_type) from user_cosmetics where user_id = p_user_id)
      >= greatest(1, (
        select count(*) from (
          select 1 from cosmetic_frames where coalesce(is_active, true)
          union all select 1 from cosmetic_banners where coalesce(is_active, true)
          union all select 1 from cosmetic_titles where coalesce(is_active, true)
        ) x where false
      ) + 3)),

    /* « Debloquez 50 autres succes » comptait des OBJECTIFS franchis.
       On compte des succes — et pas lui-meme. */
    'succes_debloques', (select count(*) from user_achievements
       where user_id = p_user_id and achievement_key <> 'legend_master_all'),

    /* « Un objectif entre minuit et 1h » comptait des CONNEXIONS de
       nuit. On lit l heure a laquelle l objectif a ete franchi. */
    'objectif_franchi_de_nuit', (exists (
      select 1 from goals g where g.pact_id = v_pacte
        and g.completion_date is not null
        and extract(hour from g.completion_date) = 0)),

    /* Huit etapes en une journee : cela se lit dans les horodatages,
       et se lit AUSSI pour les journees deja passees. */
    'huit_etapes_en_un_jour', (exists (
      select 1 from steps s join goals g on g.id = s.goal_id
       where g.pact_id = v_pacte and s.validated_at is not null
       group by s.validated_at::date having count(*) >= 8)),

    /* Un rang gagne, c est simplement avoir depasse le premier palier
       au-dessus de zero. */
    'rang_gagne', (
      public.xp_du_membre(p_user_id) >= coalesce((
        select min(r.min_points) from ranks r
         where r.user_id = p_user_id and r.min_points > 0), 2147483647))
  ) into v_calcule;

  return v_suivi || v_calcule;
end;
$$;
