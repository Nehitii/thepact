-- « AFFICHER LE STATUT D ACTIVITÉ » NE GARDAIT RIEN.
--
-- useOnlineStatus écrit profiles.last_seen_at toutes les soixante
-- secondes, et useFriendsPresence le relit pour allumer la pastille de
-- présence des alliés. Entre les deux, show_activity_status ne
-- s interposait nulle part : couper le réglage n empêchait pas de
-- diffuser sa présence.
--
-- Et la lecture était de toute façon vaine : elle interrogeait profiles
-- pour autrui, ce que la politique auth.uid() = id interdit. La
-- pastille ne s allumait donc jamais pour personne.
--
-- vu_a rejoint la projection publique et n en sort que si le profil est
-- visible ET que son porteur accepte de montrer son activité.
--
-- Ajouter une colonne de sortie change le type de retour : CREATE OR
-- REPLACE le refuse, il faut passer par DROP.
drop function if exists public.profils_publics(uuid[]);

create function public.profils_publics(p_ids uuid[])
returns table (
  id uuid,
  nom text,
  avatar text,
  decouvrable boolean,
  partage_objectifs boolean,
  vu_a timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    p.id,
    case when v.visible then p.display_name else null end,
    case when v.visible then p.avatar_url   else null end,
    v.visible,
    p.share_goals_progress,
    case when v.visible and p.show_activity_status then p.last_seen_at else null end
  from profiles p
  cross join lateral (
    select (
      p.community_profile_discoverable
      or p.id = auth.uid()
      or exists (
        select 1
          from guild_members a
          join guild_members b on b.guild_id = a.guild_id
         where a.user_id = auth.uid() and b.user_id = p.id
      )
    ) as visible
  ) v
  where p.id = any(p_ids);
$$;

comment on function public.profils_publics(uuid[]) is
  'Projection publique des profils : nom, avatar et présence nuls quand le profil ne doit pas les montrer.';

revoke all on function public.profils_publics(uuid[]) from public;
grant execute on function public.profils_publics(uuid[]) to authenticated;
