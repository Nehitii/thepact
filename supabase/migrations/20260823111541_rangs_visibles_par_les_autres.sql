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
-- LE RANG, RENDU VISIBLE AUX AUTRES
-- ═══════════════════════════════════════════════════════════════
--
-- Les dix rangs existent bel et bien — Novice, Apprenti, Adepte,
-- Veteran, Expert, Maitre, Grand-Maitre, Seigneur, Roi, Empereur —
-- et l XP qui les franchit est deja calcule, dans useRankXP.
--
-- Mais il l est COTE CLIENT, a partir des objectifs de la personne
-- connectee. Personne ne peut donc voir le rang de quelqu un d autre :
-- ni la liste des membres d une guilde, ni le classement, ni un
-- message dans le fil. Le rang existait sans jamais sortir des pages
-- Accueil et Profil.
--
-- Cette fonction porte la MEME formule en base, a l identique :
--   · objectif franchi ou valide  → tout son potential_score
--   · objectif en cours           → floor(score x avancement x 0.5)
--   · le reste                    → rien
--   · plafonne au total possible
-- L etape ultime est exclue du numerateur comme du denominateur, comme
-- dans useGoals. Toute divergence ici afficherait deux XP differents
-- pour la meme personne selon la page — c est pourquoi la formule est
-- recopiee et non reinventee.
--
-- Le pacte retenu est le pacte actif du profil ; a defaut, le plus
-- recent.

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
           count(s.id) filter (where not coalesce(s.is_ultimate, false)) as etapes,
           count(s.id) filter (where not coalesce(s.is_ultimate, false)
                                 and s.status = 'completed') as faites
      from goals g
      left join steps s on s.goal_id = g.id
     where g.pact_id = (select id from pacte)
     group by g.id, g.status, g.potential_score
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

-- ═══════════════════════════════════════════════════════════════
-- LE RANG DE PLUSIEURS PERSONNES D UN COUP
-- ═══════════════════════════════════════════════════════════════
--
-- Une liste de membres a besoin du rang de chacun. Une requete par
-- personne, c est le probleme que le module Communaute vient de
-- resoudre ailleurs (neuf requetes pour une reaction, ramenees a une).
-- On demande donc les rangs d une liste en un seul aller-retour.
--
-- Chaque personne definit SES propres paliers dans « ranks » : deux
-- membres au meme XP peuvent porter des noms differents. C est voulu,
-- et c est pourquoi on ne peut pas se contenter d une echelle unique.

create or replace function public.rangs_des_membres(p_user_ids uuid[])
returns table (user_id uuid, xp integer, rang text, couleur text, seuil integer)
language sql
stable
security definer
set search_path = public
as $$
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
$$;

comment on function public.xp_du_membre(uuid) is
  'L XP d une personne selon la meme formule que useRankXP, pour que son rang puisse etre affiche par quelqu un d autre.';
