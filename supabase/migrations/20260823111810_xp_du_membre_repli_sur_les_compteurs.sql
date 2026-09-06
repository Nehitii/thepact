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

-- LA PREMIERE VERSION COMPTAIT 1105 LA OU L APPLICATION AFFICHE 1210.
--
-- Cinq objectifs n ont AUCUNE ligne dans « steps » mais portent encore
-- leurs compteurs sur la ligne « goals » : total_steps et
-- validated_steps. useRankXP en tient compte, par une chaine de repli
-- que le || de JavaScript rend invisible a la lecture :
--
--   totalSteps     = goal.totalStepsCount || goal.total_steps || 1
--   completedSteps = goal.completedStepsCount || goal.validated_steps || 0
--
-- En JavaScript, 0 est faux : un objectif sans ligne d etape bascule
-- donc sur ses compteurs denormalises. Ces cinq objectifs valaient
-- 20 + 75 + 3 + 2 + 5 = 105 points — exactement l ecart constate.
--
-- On recopie la chaine de repli telle quelle. Le but n est pas d avoir
-- raison contre l application : c est que la meme personne lise le
-- meme XP sur toutes les pages.

create or replace function public.xp_du_membre(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
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
$$;
