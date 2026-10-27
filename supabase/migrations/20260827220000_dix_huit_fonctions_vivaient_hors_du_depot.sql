-- ═══════════════════════════════════════════════════════════════
-- DIX-HUIT FONCTIONS VIVAIENT EN PRODUCTION SANS EXISTER ICI
--
-- Cette migration ne change RIEN en production : chacune de ces
-- fonctions y existe déjà, mot pour mot. Elle répare un écart d'une
-- autre nature — le dépôt ne savait pas les décrire.
--
-- CE QUI A ÉTÉ MESURÉ, LE 27/08/2026
--
-- Les fonctions du schéma « public », extensions écartées, ont été
-- comptées en production puis cherchées dans supabase/migrations/ :
--
--   99 fonctions en production
--   19 sans aucun « create function » dans les migrations
--   17 de ces 19 appelées depuis src/
--
-- La dix-neuvième, assurer_ordres_du_jour, est entrée dans le dépôt par
-- la migration 20260827170000, qui a servi de modèle à celle-ci. Les
-- dix-huit autres sont ici.
--
-- POURQUOI C'EST GRAVE, ET PAS SEULEMENT INESTHÉTIQUE
--
-- Une base reconstruite depuis supabase/migrations/ n'aurait eu aucune
-- d'entre elles. Dix-sept appels du client seraient tombés sur une
-- fonction absente — « cordee » est référencée six fois dans src/,
-- « clore_raid » trois fois. Rien ne l'aurait signalé avant l'exécution :
-- les types de src/integrations/supabase/types.ts sont générés depuis la
-- production, donc ils les connaissent déjà.
--
-- PIRE : DEUX MIGRATIONS DU DÉPÔT LES APPELLENT SANS LES CRÉER.
--
--   public.pseudonyme_de(h.user_id)     -- dans une migration existante
--   v_xp := public.xp_du_membre(...)    -- dans une autre
--
-- Le dépôt dépendait donc déjà de fonctions qu'il ne définissait nulle
-- part. Ce n'était pas un risque théorique : c'était une reconstruction
-- déjà cassée.
--
-- CE QUE CONTIENT CETTE MIGRATION
--
-- Les définitions exactes rendues par pg_get_functiondef, sans une
-- retouche, et les droits relevés dans la même passe. Les dix-huit
-- portent la même liste, à l'identique :
--
--   postgres=X/postgres | authenticated=X/postgres | service_role=X/postgres
--
-- PUBLIC n'y figure pas — la migration 20260827141935 lui a retiré le
-- droit d'exécuter. Les revoke/grant le maintiennent sur une base neuve,
-- où « create function » redonnerait EXECUTE à PUBLIC.
--
-- SUR LA LIGNE CI-DESSOUS
--
-- Six de ces fonctions sont en « language sql », dont PostgreSQL valide
-- le corps à la création. Certaines s'appellent entre elles, et l'ordre
-- alphabétique ne respecte pas ces dépendances. check_function_bodies est
-- donc désactivé le temps de la transaction, comme le fait pg_dump pour
-- la même raison. Les corps ne sont pas à vérifier : ils viennent d'une
-- base où ils s'exécutent déjà.
-- ═══════════════════════════════════════════════════════════════

set local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assurer_offres_du_jour()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_creees integer := 0;
begin
  if exists (select 1 from shop_daily_deals where deal_date = current_date) then
    return 0;
  end if;

  with candidats as (
    select id, 'cosmetic_frame' as type, price from cosmetic_frames  where is_active and not is_default and price > 0
    union all
    select id, 'cosmetic_banner',        price from cosmetic_banners where is_active and not is_default and price > 0
    union all
    select id, 'cosmetic_title',         price from cosmetic_titles  where is_active and not is_default and price > 0
  ),
  tirage as (
    select id, type,
           row_number() over (order by md5(id::text || current_date::text)) as rang
    from candidats
  )
  insert into shop_daily_deals (item_id, item_type, discount_percentage, deal_date, is_active)
  select id, type,
         case rang when 1 then 40 when 2 then 30 else 20 end,
         current_date, true
  from tirage where rang <= 3;

  get diagnostics v_creees = row_count;
  return v_creees;
end;
$function$
;
REVOKE ALL ON FUNCTION public.assurer_offres_du_jour() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assurer_offres_du_jour() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.categories_cosmetiques()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$
  /* Trois familles de cosmetiques, portees par trois tables. Ajouter
     une quatrieme famille demandera une table — et une visite ici. */
  select 3;
$function$
;
REVOKE ALL ON FUNCTION public.categories_cosmetiques() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.categories_cosmetiques() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.clore_raid(p_raid_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_raid public.guild_raids;
  v_av jsonb;
  v_tot jsonb;
  v_reussi boolean;
  v_xp integer;
begin
  select * into v_raid from public.guild_raids where id = p_raid_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Raid introuvable');
  end if;

  if not exists (
    select 1 from public.guild_members m
     where m.guild_id = v_raid.guild_id and m.user_id = auth.uid()
  ) then
    return jsonb_build_object('success', false, 'error', 'Vous n''etes pas membre de cette guilde');
  end if;

  if v_raid.resultat is not null then
    return jsonb_build_object('success', true, 'deja_clos', true, 'etat', v_raid.etat);
  end if;

  if now() < v_raid.finit_le then
    return jsonb_build_object('success', false, 'error', 'Le raid court encore');
  end if;

  v_av := public.guild_raid_avancement(p_raid_id);
  v_tot := v_av -> 'totaux';

  v_reussi :=
        (v_tot ->> 'etapes')::int    >= v_raid.cible_etapes
    and (v_tot ->> 'objectifs')::int >= v_raid.cible_objectifs
    and (v_tot ->> 'taches')::int    >= v_raid.cible_taches
    and (v_tot ->> 'journal')::int   >= v_raid.cible_journal;

  v_xp := case when v_reussi then
    v_raid.cible_etapes + v_raid.cible_taches
    + v_raid.cible_journal * 5 + v_raid.cible_objectifs * 10
  else 0 end;

  update public.guild_raids
     set etat = case when v_reussi then 'reussi' else 'echoue' end,
         clos_le = now(),
         resultat = v_av - 'trouve' - 'fige'
           || jsonb_build_object(
                'reussi', v_reussi,
                'xp', v_xp,
                'cibles', jsonb_build_object(
                  'etapes', v_raid.cible_etapes,
                  'objectifs', v_raid.cible_objectifs,
                  'taches', v_raid.cible_taches,
                  'journal', v_raid.cible_journal
                )
              )
   where id = p_raid_id;

  if v_xp > 0 then
    perform public.add_guild_xp(v_raid.guild_id, v_xp, v_raid.titre);
  end if;

  return jsonb_build_object(
    'success', true, 'deja_clos', false,
    'reussi', v_reussi, 'xp', v_xp
  );
end;
$function$
;
REVOKE ALL ON FUNCTION public.clore_raid(p_raid_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clore_raid(p_raid_id uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.contribution_membre(p_user_id uuid, p_debut timestamp with time zone, p_fin timestamp with time zone)
 RETURNS TABLE(etapes integer, objectifs integer, taches integer, journal integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    (select count(*)::int
       from steps s
       join goals g on g.id = s.goal_id
       join pacts p on p.id = g.pact_id
      where p.user_id = p_user_id
        and s.validated_at is not null
        and s.validated_at >= p_debut and s.validated_at < p_fin),
    (select count(*)::int
       from goals g
       join pacts p on p.id = g.pact_id
      where p.user_id = p_user_id
        and g.completion_date is not null
        and g.completion_date >= p_debut and g.completion_date < p_fin),
    (select count(*)::int
       from todo_tasks t
      where t.user_id = p_user_id
        and t.completed_at is not null
        and t.completed_at >= p_debut and t.completed_at < p_fin),
    -- Les jours DISTINCTS ou l'on a ecrit : trois entrees le meme
    -- jour ne valent pas trois jours de constance.
    (select count(distinct (j.created_at at time zone 'UTC')::date)::int
       from journal_entries j
      where j.user_id = p_user_id
        and j.created_at >= p_debut and j.created_at < p_fin);
$function$
;
REVOKE ALL ON FUNCTION public.contribution_membre(p_user_id uuid, p_debut timestamp with time zone, p_fin timestamp with time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.contribution_membre(p_user_id uuid, p_debut timestamp with time zone, p_fin timestamp with time zone) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cordee(p_user_id uuid)
 RETURNS TABLE(place integer, nom text, devise text, xp integer, objectifs integer, etapes integer, serie integer, rang text, couleur text, vu_il_y_a_h integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_pacte uuid;
  v_xp_max integer;
  v_objectifs integer;
  v_etapes integer;
  v_graine bigint;

  noms text[] := array[
    'Lena Mraz', 'kaede', 'Théo B.', 'marc_oliveira', 'Aurore',
    'nils.hv', 'Sam Wren', 'yohan_dt', 'Iris Kovac', 'petit.ours',
    'D. Fontaine', 'akira', 'Camille R.', 'jonas_w', 'Noor',
    'elsa.k', 'Rafael M.'
  ];

  devises text[] := array[
    'jour 214',
    'on verra',
    '« Nous souffrons plus souvent en imagination qu''en réalité. » — Sénèque',
    'reprise après 3 mois d''arrêt, doucement',
    'pas très fier du mois dernier',
    'je note tout, sinon j''oublie',
    'lever 5h40 — non négociable',
    '« Bien commencer n''est rien, bien finir est tout. »',
    'la moitié du chemin',
    'ici pour les steps, pas pour les points',
    'ça avance',
    'objectif : finir avant décembre',
    '2e tentative. la bonne j''espère',
    '« Ce n''est pas parce que c''est difficile que nous n''osons pas. » — Sénèque',
    'rien à dire, juste faire',
    'mes semaines sont plus régulières que mes journées',
    'toujours là'
  ];

  parts numeric[] := array[
    0.90, 0.81, 0.74, 0.66, 0.58, 0.50, 0.43,
    0.36, 0.29, 0.23, 0.17, 0.12, 0.07
  ];

  n_noms integer;
  n_devises integer;
  i integer;
  v_part numeric;
  v_bruit numeric;
  v_xp integer;
begin
  n_noms := array_length(noms, 1);
  n_devises := array_length(devises, 1);

  select coalesce(
    (select pr.active_pact_id from profiles pr where pr.id = p_user_id),
    (select pa.id from pacts pa where pa.user_id = p_user_id order by pa.created_at desc limit 1)
  ) into v_pacte;

  if v_pacte is null then return; end if;

  select count(*)::int, coalesce(sum(coalesce(g.potential_score, 0)), 0)::int
    into v_objectifs, v_xp_max
    from goals g where g.pact_id = v_pacte;

  select coalesce(sum(greatest(
           (select count(*) from steps s
             where s.goal_id = g.id and not coalesce(s.is_ultimate, false)),
           coalesce(g.total_steps, 0)
         )), 0)::int
    into v_etapes
    from goals g where g.pact_id = v_pacte;

  if v_xp_max <= 0 or v_objectifs <= 0 then return; end if;

  v_graine := ('x' || substr(md5(p_user_id::text), 1, 8))::bit(32)::bigint;

  for i in 1 .. array_length(parts, 1) loop
    v_part := parts[i];
    v_bruit := 1 + (((v_graine + i * 2654435761) % 61) - 30)::numeric / 1000;
    v_xp := greatest(1, round(v_xp_max * v_part * v_bruit))::int;

    place := i;
    nom := noms[1 + ((v_graine + i * 7) % n_noms)::int];
    /* Une phrase sur cinq environ reste vide : tout le monde ne remplit
       pas son profil, et une liste ou chacun a sa maxime se voit. */
    devise := case when ((v_graine + i * 23) % 5) = 0
                then null
                else devises[1 + ((v_graine + i * 11) % n_devises)::int]
              end;
    xp := v_xp;
    objectifs := greatest(0, round(v_objectifs * v_part * v_bruit))::int;
    etapes := greatest(0, round(v_etapes * v_part * v_bruit))::int;
    serie := greatest(1, round(v_part * 180 * v_bruit))::int;
    vu_il_y_a_h := 1 + ((v_graine / 13 + i * 17) % 52)::int;

    select r.name, r.frame_color into rang, couleur
      from ranks r
     where r.user_id = p_user_id and r.min_points <= v_xp
     order by r.min_points desc limit 1;

    return next;
  end loop;
end;
$function$
;
REVOKE ALL ON FUNCTION public.cordee(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cordee(p_user_id uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.fondateur_membre_de_sa_guilde()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.guild_members (guild_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$function$
;
REVOKE ALL ON FUNCTION public.fondateur_membre_de_sa_guilde() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fondateur_membre_de_sa_guilde() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guild_raid_avancement(p_raid_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_raid public.guild_raids;
  v_membres jsonb;
  v_total record;
begin
  select * into v_raid from public.guild_raids where id = p_raid_id;
  if not found then
    return jsonb_build_object('trouve', false);
  end if;

  -- Un raid clos rend ce qui a ete fige, jamais un recalcul.
  if v_raid.resultat is not null then
    return v_raid.resultat || jsonb_build_object('trouve', true, 'fige', true);
  end if;

  select
    coalesce(sum(c.etapes), 0)::int as etapes,
    coalesce(sum(c.objectifs), 0)::int as objectifs,
    coalesce(sum(c.taches), 0)::int as taches,
    coalesce(sum(c.journal), 0)::int as journal
  into v_total
  from public.guild_members m
  cross join lateral public.contribution_membre(m.user_id, v_raid.commence_le, v_raid.finit_le) c
  where m.guild_id = v_raid.guild_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'user_id', m.user_id,
           'etapes', c.etapes,
           'objectifs', c.objectifs,
           'taches', c.taches,
           'journal', c.journal
         ) order by (c.etapes + c.objectifs + c.taches + c.journal) desc), '[]'::jsonb)
  into v_membres
  from public.guild_members m
  cross join lateral public.contribution_membre(m.user_id, v_raid.commence_le, v_raid.finit_le) c
  where m.guild_id = v_raid.guild_id;

  return jsonb_build_object(
    'trouve', true,
    'fige', false,
    'totaux', jsonb_build_object(
      'etapes', v_total.etapes,
      'objectifs', v_total.objectifs,
      'taches', v_total.taches,
      'journal', v_total.journal
    ),
    'membres', v_membres
  );
end;
$function$
;
REVOKE ALL ON FUNCTION public.guild_raid_avancement(p_raid_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guild_raid_avancement(p_raid_id uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.maj_compte_reponses()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    update public.community_posts
       set replies_count = replies_count + 1
     where id = new.post_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.community_posts
       set replies_count = greatest(replies_count - 1, 0)
     where id = old.post_id;
    return old;
  end if;

  return null;
end;
$function$
;
REVOKE ALL ON FUNCTION public.maj_compte_reponses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.maj_compte_reponses() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.marquer_succes_vus(p_cles text[] DEFAULT NULL::text[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_touchees integer;
begin
  if auth.uid() is null then
    return 0;
  end if;

  update public.user_achievements u
     set seen = true
   where u.user_id = auth.uid()
     and u.seen is distinct from true
     /* Sans liste, on marque tout ce qui reste : c est ce que fait la
        page quand elle a fini d annoncer. */
     and (p_cles is null or u.achievement_key = any(p_cles));

  get diagnostics v_touchees = row_count;
  return v_touchees;
end;
$function$
;
REVOKE ALL ON FUNCTION public.marquer_succes_vus(p_cles text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marquer_succes_vus(p_cles text[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mesures_du_membre(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    /* Compte par rapport a CE QUI EXISTE, jamais un nombre fige : le
       seuil de huit rendait « tous les modules » ingagnable pour six
       modules. */
    'tous_les_modules', (
      (select count(*) from shop_modules) > 0
      and (select count(*) from user_module_purchases where user_id = p_user_id)
          >= (select count(*) from shop_modules)),

    'toutes_categories_cosmetiques', (
      (select count(distinct cosmetic_type) from user_cosmetics where user_id = p_user_id)
      >= public.categories_cosmetiques()),

    'succes_debloques', (select count(*) from user_achievements
       where user_id = p_user_id and achievement_key <> 'legend_master_all'),

    'objectif_franchi_de_nuit', (exists (
      select 1 from goals g where g.pact_id = v_pacte
        and g.completion_date is not null
        and extract(hour from g.completion_date) = 0)),

    'huit_etapes_en_un_jour', (exists (
      select 1 from steps s join goals g on g.id = s.goal_id
       where g.pact_id = v_pacte and s.validated_at is not null
       group by s.validated_at::date having count(*) >= 8)),

    'rang_gagne', (
      public.xp_du_membre(p_user_id) >= coalesce((
        select min(r.min_points) from ranks r
         where r.user_id = p_user_id and r.min_points > 0), 2147483647))
  ) into v_calcule;

  return v_suivi || v_calcule;
end;
$function$
;
REVOKE ALL ON FUNCTION public.mesures_du_membre(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mesures_du_membre(p_user_id uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.pas_d_adresse_en_pseudo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.display_name is null
     or btrim(new.display_name) = ''
     or new.display_name like '%@%' then
    new.display_name := public.pseudonyme_de(new.id);
  end if;
  return new;
end;
$function$
;
REVOKE ALL ON FUNCTION public.pas_d_adresse_en_pseudo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pas_d_adresse_en_pseudo() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.pouls_du_jour(p_debut timestamp with time zone, p_fin timestamp with time zone, p_jour date)
 RETURNS TABLE(taches integer, appel integer, journal integer, sante integer, focus_minutes integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    (select count(*)::int
       from todo_tasks t
      where t.user_id = auth.uid()
        and t.completed_at >= p_debut and t.completed_at < p_fin),

    -- L'appel se note sur le pacte, pas dans une table d'evenements :
    -- une seule date, celle du dernier appel tenu.
    (select count(*)::int
       from pacts p
      where p.user_id = auth.uid()
        and p.last_checkin_date = p_jour),

    (select count(*)::int
       from journal_entries j
      where j.user_id = auth.uid()
        and j.created_at >= p_debut and j.created_at < p_fin),

    -- entry_date est une DATE : elle est deja dans le calendrier de
    -- l'utilisateur, on la compare au jour local et non a la fenetre.
    (select count(*)::int
       from health_data h
      where h.user_id = auth.uid()
        and h.entry_date = p_jour),

    -- Des MINUTES et non un nombre de sessions : trois minutes et une
    -- heure de concentration ne disent pas la meme chose.
    (select coalesce(sum(f.duration_minutes), 0)::int
       from focus_sessions f
      where f.user_id = auth.uid()
        and f.started_at >= p_debut and f.started_at < p_fin);
$function$
;
REVOKE ALL ON FUNCTION public.pouls_du_jour(p_debut timestamp with time zone, p_fin timestamp with time zone, p_jour date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pouls_du_jour(p_debut timestamp with time zone, p_fin timestamp with time zone, p_jour date) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.pseudonyme_de(p_id uuid)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select (array[
    'Renard', 'Héron', 'Faucon', 'Loutre', 'Corbeau', 'Chouette',
    'Lynx', 'Cerf', 'Martre', 'Blaireau', 'Hermine', 'Bouquetin',
    'Balbuzard', 'Sanglier', 'Chamois', 'Milan', 'Belette', 'Grèbe',
    'Bruant', 'Genette', 'Marmotte', 'Busard', 'Fouine', 'Alouette'
  ])[1 + (('x' || substr(md5(p_id::text), 1, 6))::bit(24)::int % 24)]
  || ' ' ||
  (array[
    'Patient', 'Discret', 'Tenace', 'Sobre', 'Constant', 'Obstiné',
    'Tranquille', 'Attentif', 'Méthodique', 'Silencieux', 'Vigilant',
    'Appliqué', 'Régulier', 'Posé', 'Résolu', 'Endurant',
    'Prudent', 'Assidu', 'Serein', 'Opiniâtre'
  ])[1 + (('x' || substr(md5(p_id::text), 7, 6))::bit(24)::int % 20)];
$function$
;
REVOKE ALL ON FUNCTION public.pseudonyme_de(p_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pseudonyme_de(p_id uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rangs_des_membres(p_user_ids uuid[])
 RETURNS TABLE(user_id uuid, xp integer, rang text, couleur text, seuil integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select u.id,
         x.xp,
         r.name,
         r.frame_color,
         r.min_points
    from unnest(p_user_ids) as u(id)
    cross join lateral (select public.xp_du_membre(u.id) as xp) x
    left join lateral (
      select rr.name, rr.frame_color, rr.min_points
        from ranks rr
       where rr.user_id = u.id and rr.min_points <= x.xp
       order by rr.min_points desc
       limit 1
    ) r on true;
$function$
;
REVOKE ALL ON FUNCTION public.rangs_des_membres(p_user_ids uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rangs_des_membres(p_user_ids uuid[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rattraper_les_succes(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ajoutes integer := 0;
  v_du integer := 0;
begin
  insert into public.user_achievements (user_id, achievement_key, unlocked_at, progress, seen)
  select p_user_id, s.cle, now(), 100, false
    from public.succes_du_membre(p_user_id) s
   where s.obtenu and s.obtenu_le is null
  on conflict do nothing;

  get diagnostics v_ajoutes = row_count;

  /* DEUX FORMES DE TRACE COHABITENT. Les versements recents portent
     reference_id = definition.id ; les anciens portent une description
     « Achievement: <clef> » et une reference qui designe autre chose.
     Ignorer les seconds revient a repayer sept succes — c est
     exactement ce qui vient d arriver. */
  select coalesce(sum(coalesce(d.bond_reward, 0)), 0)::int into v_du
    from user_achievements u
    join achievement_definitions d on d.key = u.achievement_key
   where u.user_id = p_user_id
     and coalesce(d.bond_reward, 0) > 0
     and not exists (
       select 1 from bond_transactions bt
        where bt.user_id = p_user_id
          and bt.reference_type = 'achievement'
          and (bt.reference_id = d.id or bt.description = 'Achievement: ' || d.key)
     );

  if v_du > 0 then
    insert into public.bond_transactions
      (user_id, amount, transaction_type, description, reference_type, reference_id)
    select p_user_id, coalesce(d.bond_reward, 0), 'earned',
           coalesce(d.nom_fr, d.name), 'achievement', d.id
      from user_achievements u
      join achievement_definitions d on d.key = u.achievement_key
     where u.user_id = p_user_id
       and coalesce(d.bond_reward, 0) > 0
       and not exists (
         select 1 from bond_transactions bt
          where bt.user_id = p_user_id
            and bt.reference_type = 'achievement'
            and (bt.reference_id = d.id or bt.description = 'Achievement: ' || d.key)
       );

    insert into public.bond_balance (user_id, balance)
    values (p_user_id, v_du)
    on conflict (user_id) do update
      set balance = coalesce(public.bond_balance.balance, 0) + v_du,
          updated_at = now();
  end if;

  return jsonb_build_object('succes_ajoutes', v_ajoutes, 'bonds_verses', v_du);
end;
$function$
;
REVOKE ALL ON FUNCTION public.rattraper_les_succes(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rattraper_les_succes(p_user_id uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reclamer_les_trophees(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_neufs integer := 0;
  v_bonds integer := 0;
begin
  with complets as (
    select s.categorie,
           count(*)::int as combien,
           count(*) filter (where s.obtenu)::int as obtenus
      from public.succes_du_membre(p_user_id) s
     group by s.categorie
    having count(*) = count(*) filter (where s.obtenu)
       and count(*) > 0
  ),
  poses as (
    insert into public.trophees_gagnes (user_id, categorie, succes_dans_la_categorie, bonds)
    select p_user_id, c.categorie, c.combien, c.combien * 50
      from complets c
    on conflict (user_id, categorie) do nothing
    returning categorie, bonds
  )
  select count(*)::int, coalesce(sum(bonds), 0)::int into v_neufs, v_bonds from poses;

  if v_bonds > 0 then
    insert into public.bond_transactions
      (user_id, amount, transaction_type, description, reference_type)
    select p_user_id, t.bonds, 'earned',
           'Trophée · ' || t.categorie, 'trophy'
      from public.trophees_gagnes t
     where t.user_id = p_user_id
       and not exists (
         select 1 from bond_transactions bt
          where bt.user_id = p_user_id
            and bt.reference_type = 'trophy'
            and bt.description = 'Trophée · ' || t.categorie
       );

    insert into public.bond_balance (user_id, balance)
    values (p_user_id, v_bonds)
    on conflict (user_id) do update
      set balance = coalesce(public.bond_balance.balance, 0) + v_bonds,
          updated_at = now();
  end if;

  return jsonb_build_object('trophees_neufs', v_neufs, 'bonds_verses', v_bonds);
end;
$function$
;
REVOKE ALL ON FUNCTION public.reclamer_les_trophees(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reclamer_les_trophees(p_user_id uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.succes_du_membre(p_user_id uuid, p_langue text DEFAULT NULL::text)
 RETURNS TABLE(cle text, nom text, categorie text, rarete text, description text, saveur text, icone text, cache boolean, points integer, bonds integer, mesure text, seuil numeric, valeur numeric, obtenu boolean, obtenu_le timestamp with time zone, avancement numeric, sommeil text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_mesures jsonb;
  v_fr boolean;
begin
  v_mesures := public.mesures_du_membre(p_user_id);

  v_fr := coalesce(
    lower(coalesce(p_langue, (select pr.language from profiles pr where pr.id = p_user_id))),
    'fr'
  ) like 'fr%';

  return query
  with juge as (
    select d.key,
           case when v_fr then coalesce(d.nom_fr, d.name) else d.name end as nom,
           d.category, d.rarity,
           case when v_fr then coalesce(d.description_fr, d.description) else d.description end as descr,
           case when v_fr then coalesce(d.saveur_fr, d.flavor_text) else d.flavor_text end as saveur,
           d.icon_key, d.is_hidden, coalesce(d.points, 0) as points,
           coalesce(d.bond_reward, 0) as bonds,
           d.conditions->>'type' as mesure,
           case
             when jsonb_typeof(d.conditions->'value') = 'boolean' then 1
             else nullif(coalesce(
               d.conditions->>'value', d.conditions->>'count', d.conditions->>'days'
             ), '')::numeric
           end as seuil,
           case
             when jsonb_typeof(v_mesures->(d.conditions->>'type')) = 'boolean'
               then case when (v_mesures->>(d.conditions->>'type'))::boolean then 1 else 0 end
             when (v_mesures->>(d.conditions->>'type')) ~ '^-?[0-9]+(\.[0-9]+)?$'
               then (v_mesures->>(d.conditions->>'type'))::numeric
             else null
           end as valeur,
           (d.required_module is null or exists (
              select 1 from user_module_purchases ump
                join shop_modules sm on sm.id = ump.module_id
               where ump.user_id = p_user_id and sm.key = d.required_module
           )) as module_ok,
           u.unlocked_at
      from achievement_definitions d
      left join user_achievements u
        on u.achievement_key = d.key and u.user_id = p_user_id
     where d.actif
  )
  select j.key, j.nom, j.category, j.rarity, j.descr, j.saveur,
         j.icon_key, j.is_hidden, j.points, j.bonds, j.mesure, j.seuil, j.valeur,
         (j.unlocked_at is not null)
           or (j.module_ok and j.valeur is not null and j.seuil is not null and j.valeur >= j.seuil),
         j.unlocked_at,
         case
           when j.unlocked_at is not null then 1
           when j.seuil is null or j.seuil <= 0 or j.valeur is null then 0
           else least(1, round(j.valeur / j.seuil, 4))
         end,
         case
           when j.unlocked_at is not null then null
           when not j.module_ok then 'module'
           when j.mesure = 'friends_count'
                and coalesce(j.valeur, 0) = 0 then 'personne'
           when j.mesure in ('pomodoro_sessions', 'pomodoro_total_minutes')
                and coalesce((v_mesures->>'pomodoro_sessions')::numeric, 0) = 0 then 'inactif'
           when j.mesure = 'guild_messages_sent'
                and coalesce(j.valeur, 0) = 0
                and coalesce((v_mesures->>'guilds_joined')::numeric, 0) = 0 then 'personne'
           else null
         end
    from juge j;
end;
$function$
;
REVOKE ALL ON FUNCTION public.succes_du_membre(p_user_id uuid, p_langue text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.succes_du_membre(p_user_id uuid, p_langue text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.xp_du_membre(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with pacte as (
    select coalesce(
      (select pr.active_pact_id from profiles pr where pr.id = p_user_id),
      (select p.id from pacts p where p.user_id = p_user_id order by p.created_at desc limit 1)
    ) as id
  ),
  par_objectif as (
    select g.status,
           coalesce(g.potential_score, 0) as score,
           /* nullif(x, 0) rend le « 0 est faux » de JavaScript. */
           coalesce(
             nullif(count(s.id) filter (where not coalesce(s.is_ultimate, false)), 0),
             nullif(g.total_steps, 0),
             1
           ) as etapes,
           coalesce(
             nullif(count(s.id) filter (where not coalesce(s.is_ultimate, false)
                                          and s.status = 'completed'), 0),
             g.validated_steps,
             0
           ) as faites
      from goals g
      left join steps s on s.goal_id = g.id
     where g.pact_id = (select id from pacte)
     group by g.id, g.status, g.potential_score, g.total_steps, g.validated_steps
  )
  select coalesce(least(
    sum(case
          when status in ('fully_completed', 'validated') then score
          when status = 'in_progress'
            then floor(score * (faites::numeric / greatest(etapes, 1)) * 0.5)
          else 0
        end),
    sum(score)
  ), 0)::int
  from par_objectif;
$function$
;
REVOKE ALL ON FUNCTION public.xp_du_membre(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.xp_du_membre(p_user_id uuid) TO authenticated, service_role;
