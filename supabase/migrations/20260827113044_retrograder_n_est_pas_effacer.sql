-- ═══════════════════════════════════════════════════════════════
-- RÉTROGRADER N'EST PAS EFFACER
--
-- CONSTATÉ EN S'EN SERVANT, ce qui est la seule façon de le voir :
-- après avoir retiré leur rôle à deux administrateurs dormants, les
-- deux comptes ont DISPARU de l'écran des accès.
--
-- La cause tient en deux morceaux :
--
--   1. `changer_le_role(..., false)` SUPPRIMAIT la ligne de rôle au
--      lieu de la ramener à « user ». Le compte se retrouvait sans
--      aucune ligne dans user_roles.
--   2. `roster_admin()` construisait sa liste À PARTIR de user_roles.
--      Sans ligne, pas de compte affiché.
--
-- Conséquence : on rétrograde quelqu'un, il s'évapore de l'écran, et
-- on ne peut plus lui rendre son rôle depuis là — alors que c'est
-- exactement l'endroit prévu pour ça. Un écran d'administration doit
-- rendre ses actes réversibles au même endroit qu'il les commet.
--
-- Le même défaut frappait un compte tout neuf : jamais nommé, jamais
-- rétrogradé, donc jamais de ligne, donc invisible aux accès.
--
-- ═══ CE QUI CHANGE ═══
--
--   · Rétrograder POSE « user ». Le compte reste, avec son rang
--     ordinaire, et le bouton « Nommer » redevient disponible.
--   · Le roster part de `profiles` et va CHERCHER le rôle, au lieu de
--     partir des rôles. Personne ne peut plus manquer à l'appel.
--
-- RATTRAPAGE : les deux comptes rétrogradés à l'instant retrouvent
-- leur ligne « user ». Aucun rôle d'administrateur n'est rendu.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Le roster part des comptes, pas des rôles ───────────────

create or replace function public.roster_admin()
returns table(
  user_id uuid, nom text, role text,
  depuis timestamptz, derniere_connexion timestamptz,
  a_un_second_facteur boolean, c_est_moi boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    p.id,
    coalesce(nullif(btrim(p.display_name), ''), 'Sans nom'),
    -- Sans ligne de rôle, le compte est un compte ordinaire : c'est ce
    -- que `has_role` conclut de toute façon. On le dit plutôt que de
    -- faire disparaître la personne.
    coalesce(r.role::text, 'user'),
    coalesce(r.created_at, u.created_at),
    u.last_sign_in_at,
    exists (select 1 from auth.mfa_factors f
             where f.user_id = p.id and f.status = 'verified'),
    p.id = auth.uid()
  from profiles p
  left join user_roles r on r.user_id = p.id
  left join auth.users u on u.id = p.id
  where has_role(auth.uid(), 'admin'::app_role)
  order by (coalesce(r.role::text, 'user') = 'admin') desc,
           u.last_sign_in_at desc nulls last;
$$;

comment on function public.roster_admin() is
  'Tous les comptes et leur rôle, pour l''écran des accès. Part de profiles et va chercher le rôle : un compte sans ligne de rôle reste visible, en « user ».';

-- ── 2. Rétrograder pose « user » ───────────────────────────────

create or replace function public.changer_le_role(p_user_id uuid, p_admin boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_restants integer;
begin
  if not est_admin_eleve() then
    raise exception 'Réservé aux administrateurs avec une session élevée (aal2).'
      using errcode = '42501';
  end if;

  if p_admin then
    -- On remplace le rang ordinaire par le rôle d'administrateur.
    delete from user_roles where user_id = p_user_id and role = 'user'::app_role;
    insert into user_roles (user_id, role)
    values (p_user_id, 'admin'::app_role)
    on conflict do nothing;
  else
    -- DEUX VERROUS CONTRE L'ENFERMEMENT DEHORS. On ne retire pas son
    -- propre rôle — l'erreur d'un clic coûterait l'accès — et on ne
    -- retire jamais le dernier : plus personne ne pourrait en redonner.
    if p_user_id = auth.uid() then
      raise exception 'On ne retire pas son propre rôle d''administrateur.'
        using errcode = '42501';
    end if;
    select count(*) into v_restants
    from user_roles where role = 'admin'::app_role and user_id <> p_user_id;
    if v_restants = 0 then
      raise exception 'Il doit rester au moins un administrateur.'
        using errcode = '42501';
    end if;

    delete from user_roles where user_id = p_user_id and role = 'admin'::app_role;
    -- RÉTROGRADER N'EST PAS EFFACER : le compte garde un rang.
    insert into user_roles (user_id, role)
    values (p_user_id, 'user'::app_role)
    on conflict do nothing;
  end if;

  insert into admin_audit_log (admin_user_id, action, target_type, target_id, metadata)
  values (auth.uid(), case when p_admin then 'role_donne' else 'role_retire' end,
          'user_role', p_user_id::text, jsonb_build_object('admin', p_admin));

  return jsonb_build_object('ok', true);
end;
$$;

-- ── 3. Rattrapage des comptes sans rôle ────────────────────────

insert into public.user_roles (user_id, role)
select p.id, 'user'::app_role
from public.profiles p
where not exists (select 1 from public.user_roles r where r.user_id = p.id);

-- ── 4. Vérification dans la transaction ────────────────────────

do $$
declare sans_role integer;
begin
  select count(*) into sans_role
  from public.profiles p
  where not exists (select 1 from public.user_roles r where r.user_id = p.id);

  if sans_role > 0 then
    raise exception '% compte(s) restent sans rôle.', sans_role;
  end if;

  if (select count(*) from public.user_roles where role = 'admin'::app_role) = 0 then
    raise exception 'Plus aucun administrateur.';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- POUR ANNULER : reprendre les deux corps de fonction de la migration
-- 20260827095521. Rétrograder recommencerait alors à faire disparaître
-- le compte de l'écran des accès.
-- ═══════════════════════════════════════════════════════════════
