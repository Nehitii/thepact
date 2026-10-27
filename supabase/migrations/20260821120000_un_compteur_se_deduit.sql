-- UN COMPTEUR SE DEDUIT, IL NE S INCREMENTE PLUS.
--
-- Deux ecarts mesures avant cette migration, sur le meme compte :
--
--   steps_completed_total = 132  pour 119 etapes reellement faites
--     trackStepCompleted() ajoutait +1 a chaque coche, sans memoire de
--     ce qui avait deja ete compte : decocher puis recocher la meme
--     etape la comptait deux fois. Les jours d habitude tombaient dans
--     le meme compteur, alors qu un jour n est pas une etape.
--
--   goals_completed_total = 4  pour 13 objectifs reellement franchis
--     seul le bouton « tout completer » incrementait. Un objectif
--     acheve en cochant sa derniere etape — le cas ordinaire — ne
--     comptait jamais. Les compteurs par palier, eux, sont restes a
--     zero sur les treize.
--
-- Les deux defauts ont la meme cause : un fait etait suivi par ses
-- evenements au lieu d etre lu. On le lit desormais. C est la lecon
-- deja tiree pour les compteurs de groupe, appliquee ici.
--
-- Les groupes (goal_type = 'super') sont exclus du calcul : un groupe
-- est un contenant. L honorer compterait une seconde fois le travail
-- de ses membres, c est-a-dire exactement le double comptage qu on
-- corrige. Les habitudes, elles, comptent : ce sont de vrais objectifs.
--
-- La recompense d un succes reste versee une seule fois a vie —
-- grant_achievement() verifie user_achievements avant de crediter. Un
-- compteur juste ne peut donc pas etre transforme en monnaie.

-- Le calcul lui-meme, isole pour que la migration puisse l appliquer
-- aux comptes existants sans passer par auth.uid().
create or replace function public.compter_le_reel(p_user_id uuid)
returns table (
  crees int, crees_easy int, crees_medium int, crees_hard int,
  crees_extreme int, crees_impossible int, crees_custom int,
  franchis int, franchis_easy int, franchis_medium int, franchis_hard int,
  franchis_extreme int, franchis_impossible int, franchis_custom int,
  etapes int
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with miens as (
    select g.id, g.difficulty, g.status
      from goals g
      join pacts p on p.id = g.pact_id
     where p.user_id = p_user_id
       and coalesce(g.goal_type, 'normal') <> 'super'
  ),
  franchis as (
    select * from miens where status in ('fully_completed', 'validated')
  )
  select
    (select count(*) from miens)::int,
    (select count(*) from miens where difficulty = 'easy')::int,
    (select count(*) from miens where difficulty = 'medium')::int,
    (select count(*) from miens where difficulty = 'hard')::int,
    (select count(*) from miens where difficulty = 'extreme')::int,
    (select count(*) from miens where difficulty = 'impossible')::int,
    (select count(*) from miens where difficulty = 'custom')::int,
    (select count(*) from franchis)::int,
    (select count(*) from franchis where difficulty = 'easy')::int,
    (select count(*) from franchis where difficulty = 'medium')::int,
    (select count(*) from franchis where difficulty = 'hard')::int,
    (select count(*) from franchis where difficulty = 'extreme')::int,
    (select count(*) from franchis where difficulty = 'impossible')::int,
    (select count(*) from franchis where difficulty = 'custom')::int,
    (select count(*) from steps s
      where s.goal_id in (select id from miens) and s.status = 'completed')::int;
$function$;

create or replace function public.resynchroniser_compteurs_succes()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into achievement_tracking (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  update achievement_tracking t
     set total_goals_created        = c.crees,
         easy_goals_created         = c.crees_easy,
         medium_goals_created       = c.crees_medium,
         hard_goals_created         = c.crees_hard,
         extreme_goals_created      = c.crees_extreme,
         impossible_goals_created   = c.crees_impossible,
         custom_goals_created       = c.crees_custom,
         goals_completed_total      = c.franchis,
         easy_goals_completed       = c.franchis_easy,
         medium_goals_completed     = c.franchis_medium,
         hard_goals_completed       = c.franchis_hard,
         extreme_goals_completed    = c.franchis_extreme,
         impossible_goals_completed = c.franchis_impossible,
         custom_goals_completed     = c.franchis_custom,
         steps_completed_total      = c.etapes,
         updated_at                 = now()
    from public.compter_le_reel(v_user_id) c
   where t.user_id = v_user_id;
end;
$function$;

revoke execute on function public.compter_le_reel(uuid) from anon, authenticated;
grant execute on function public.resynchroniser_compteurs_succes() to authenticated;

-- Remise a l endroit des comptes existants.
update achievement_tracking t
   set total_goals_created        = c.crees,
       easy_goals_created         = c.crees_easy,
       medium_goals_created       = c.crees_medium,
       hard_goals_created         = c.crees_hard,
       extreme_goals_created      = c.crees_extreme,
       impossible_goals_created   = c.crees_impossible,
       custom_goals_created       = c.crees_custom,
       goals_completed_total      = c.franchis,
       easy_goals_completed       = c.franchis_easy,
       medium_goals_completed     = c.franchis_medium,
       hard_goals_completed       = c.franchis_hard,
       extreme_goals_completed    = c.franchis_extreme,
       impossible_goals_completed = c.franchis_impossible,
       custom_goals_completed     = c.franchis_custom,
       steps_completed_total      = c.etapes,
       updated_at                 = now()
  from (
         select a.user_id, r.*
           from achievement_tracking a,
                lateral public.compter_le_reel(a.user_id) r
       ) c
 where c.user_id = t.user_id;
