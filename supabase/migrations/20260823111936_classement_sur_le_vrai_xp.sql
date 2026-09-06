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
-- LE CLASSEMENT CLASSAIT SUR UNE COLONNE QUE PERSONNE N ECRIT
-- ═══════════════════════════════════════════════════════════════
--
-- Il lisait « COALESCE(pa.points, 0) » — c est-a-dire pacts.points,
-- qui vaut zero pour tout le monde depuis toujours et qu aucun code de
-- l application ne met a jour. D ou la ligne signalee :
--
--     Nehiti (TOI)   Novice   0 XP   13 Objectifs
--
-- Trois erreurs dans une seule ligne. Le rang etait Novice parce qu il
-- se deduisait de ces zeros. L XP etait nul alors que l application en
-- affiche 1210 sur la page d accueil. Et le classement etait donc
-- ordonne par une colonne constante : personne ne pouvait etre premier,
-- l ordre etait arbitraire.
--
-- Il lit maintenant xp_du_membre, qui applique la formule de
-- useRankXP — celle que l application affiche vraiment.
--
-- DEUX AUTRES CHOSES CORRIGEES AU PASSAGE :
--
-- 1. goals_completed venait de achievement_tracking.goals_completed_total,
--    un compteur denormalise qui a derive : il annonce 13 la ou la base
--    en compte 14. On compte, on ne suit plus un compteur.
--
-- 2. « LEFT JOIN pacts pa ON pa.user_id = p.id » rendait UNE LIGNE PAR
--    PACTE. Aucun compte n a deux pactes aujourd hui, mais le premier
--    qui en aurait deux apparaitrait deux fois dans le classement. La
--    jointure disparait.

create or replace function public.get_public_leaderboard(p_limit integer default 50)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  points integer,
  goals_completed integer,
  rank_name text
)
language sql
stable
security definer
set search_path = public
as $$
  with monde as (
    select p.id, p.display_name, p.avatar_url,
           public.xp_du_membre(p.id) as xp,
           coalesce(
             (select pr.active_pact_id from profiles pr where pr.id = p.id),
             (select pa.id from pacts pa where pa.user_id = p.id
               order by pa.created_at desc limit 1)
           ) as pacte
      from profiles p
     where p.community_profile_discoverable = true
  )
  select m.id,
         m.display_name,
         m.avatar_url,
         m.xp,
         (select count(*)::int from goals g
           where g.pact_id = m.pacte
             and g.status in ('fully_completed', 'validated')),
         (select r.name from ranks r
           where r.user_id = m.id and r.min_points <= m.xp
           order by r.min_points desc limit 1)
    from monde m
   order by m.xp desc, m.display_name asc
   limit p_limit;
$$;
